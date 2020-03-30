import { saveAs } from "file-saver";
import streamSaver from "streamsaver";
import Metadata from "./metadata";
const { createWriteStream } = streamSaver;
import { Decryption } from "./cipher";
import Config from "./config";
import { DownloadFileSource } from "./downloadSource";

export default class DownloadFile {
    private readonly metadata: Metadata;
    private readonly decryptor: Decryption;
    private readonly source: DownloadFileSource;
    private stop: boolean;

    public constructor(
        id: string,
        sharing: string,
        metadata: Metadata,
        decryption: { key: Uint8Array; iv: Uint8Array }
    ) {
        this.metadata = metadata;
        this.decryptor = new Decryption(decryption.key, decryption.iv);
        const { startFrom, encryptedSize } = this.paramOfEncryptedFile();
        this.source = sharing
            ? new DownloadFileSource(
                  `${sharing}/${id}`,
                  "dropbox",
                  startFrom,
                  encryptedSize
              ) // dbx
            : new DownloadFileSource(id, "server", startFrom, encryptedSize); // server
        this.stop = false;
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
     * It downloads the file by using streamsaver
     *
     * @param progress - function, which is executed each time, when new chunk
     * is read
     */
    private async downloadStream(progress: (u: number) => any) {
        streamSaver.TransformStream = TransformStream;
        streamSaver.WritableStream = WritableStream;

        const writeStream: WritableStream = createWriteStream(
            this.metadata.getName(),
            {
                size: this.metadata.getSize()
            },
            this.metadata.getSize()
        );

        const writer = writeStream.getWriter();

        window.onunload = async () => {
            await writer.abort("Close window");
        };

        try {
            let chunk = await this.source.downloadChunk();

            while (chunk) {
                if (this.stop) {
                    await writer.abort("Cancel");
                    window.onunload = null;
                    return;
                }

                const decrypted = chunk.last
                    ? await this.decryptor.final(chunk.value)
                    : await this.decryptor.decrypt(chunk.value);

                await writer.write(decrypted);
                progress(decrypted.length);
                chunk = await this.source.downloadChunk();
            }
        } catch (e) {
            await writer.abort("Exception");
            window.onunload = null;

            throw e;
        }

        await writer.close();
        window.onunload = null;
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
            let chunk = await this.source.downloadChunk();

            while (chunk) {
                if (this.stop) {
                    return;
                }

                const decrypted = chunk.last
                    ? await this.decryptor.final(chunk.value)
                    : await this.decryptor.decrypt(chunk.value);

                blob = new Blob([blob, decrypted], {
                    type: "application/octet-stream"
                });
                progress(decrypted.length);
                chunk = await this.source.downloadChunk();
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
}
