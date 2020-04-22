import { saveAs } from "file-saver";
import streamSaver from "streamsaver";
import Metadata from "./metadata";
const { createWriteStream } = streamSaver;
import { Decryption } from "./cipher";
import Config from "./config";
import DownloadFileSource from "./downloadFileSource";
import { StorageType } from "./interfaces/storageType";

/**
 * It sets up listener for close tab event. If browser tab is close,
 * writer param is aborted.
 * @param writer
 */
function setCloseTabEvent(writer: { abort: (reason?: any) => Promise<void> }) {
    window.onunload = async () => {
        await writer.abort("Close window");
    };
}

/**
 * It clears close tab event.
 */
function clearCloseTabEvent() {
    window.onunload = null;
}

export default class DownloadFile {
    private readonly metadata: Metadata;
    private readonly source: DownloadFileSource;
    private readonly decryptor: Decryption;
    private stop: boolean = false;

    public constructor(
        id: string,
        receiver: StorageType,
        metadata: Metadata,
        decryption: { key: Uint8Array; iv: Uint8Array }
    ) {
        this.metadata = metadata;
        this.decryptor = new Decryption(decryption.key, decryption.iv);

        const { startFrom, encryptedSize } = this.paramOfEncryptedFile();
        this.source = new DownloadFileSource(
            id,
            receiver,
            startFrom,
            encryptedSize
        );
    }

    /**
     * It downloads file to local filesystem of user
     *
     * @param blob - False - streamsaver can be used
     *               True - streamsaver isn't supported and whole file is downloaded
     * to memory before it is downloaded to user filesystem
     * @param progress - function, which is executed each time, when new chunk
     * is read
     */
    public async download(blob: boolean, progress: (u: number) => any) {
        if (!blob) {
            return await this.downloadStream(progress);
        }

        return await this.downloadBlob(progress);
    }

    /**
     * Method, which stop downloading of file
     */
    public cancel(): void {
        this.stop = true;
    }

    /**
     * It decrypts file and it downloads the file by using streamsaver
     *
     * @param progress - function, which is executed each time, when new chunk
     * is read
     */
    private async downloadStream(progress: (u: number) => any) {
        streamSaver.TransformStream = TransformStream;
        streamSaver.WritableStream = WritableStream;

        const size = this.metadata.getSize();
        const writeStream: WritableStream = createWriteStream(
            this.metadata.getName(),
            { size },
            size
        );

        const writer = writeStream.getWriter();

        setCloseTabEvent(writer);

        try {
            let downloaded = await this.source.downloadChunk();

            while (downloaded) {
                if (this.stop) {
                    await writer.abort("Cancel");
                    return clearCloseTabEvent();
                }

                const decrypted = await this.decryptChunk(downloaded);

                await writer.write(decrypted);
                progress(decrypted.length);
                downloaded = await this.source.downloadChunk();
            }
        } catch (e) {
            await writer.abort("Exception");
            clearCloseTabEvent();

            throw e;
        }

        await writer.close();
        clearCloseTabEvent();
    }

    /**
     * It stores the file to memory and finally is downloaded to user filesystem
     *
     * @param progress - function, which is executed each time, when new chunk
     * is read
     */
    private async downloadBlob(progress: (u: number) => any) {
        let blob = new Blob([], { type: "application/octet-stream" });
        try {
            let downloaded = await this.source.downloadChunk();

            while (downloaded) {
                if (this.stop) {
                    return;
                }

                const decrypted = await this.decryptChunk(downloaded);

                blob = new Blob([blob, decrypted], {
                    type: "application/octet-stream"
                });
                progress(decrypted.length);
                downloaded = await this.source.downloadChunk();
            }
        } catch (e) {
            throw e;
        }

        if (!this.stop) {
            saveAs(blob, this.metadata.getName());
        }
    }

    /**
     * It calculates size of whole saved file and first position, where
     * data of file starts.
     *
     * @return Object, which contains position, where data of file starts and
     * size of whole saved file
     */
    private paramOfEncryptedFile(): {
        startFrom: number;
        encryptedSize: number;
    } {
        const { ivLength, saltLength, authTagLength } = Config.cipher;
        const metadataSize = this.metadata.toUint8Array().length;

        const s = ivLength + 1 + saltLength + 2 + metadataSize + authTagLength;
        const encryptedSize = s + this.metadata.getSize() + authTagLength;
        return { startFrom: s, encryptedSize };
    }

    /**
     * It decrypts data defined by data.value param. If current
     * chunk is last, decryptor is closed by final method and there is checked
     * validity of authTag. If authTag isn't valid, it throws Exception.
     *
     * @param data
     * @return Promise with decrypted chunk
     */
    private decryptChunk(data: {
        value: Uint8Array;
        last: boolean;
    }): Promise<Uint8Array> {
        if (data.last) {
            return this.decryptor.final(data.value);
        }
        return this.decryptor.decrypt(data.value);
    }
}
