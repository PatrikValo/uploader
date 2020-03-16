import { saveAs } from "file-saver";
import streamSaver from "streamsaver";
import { Cipher } from "./cipher";
import DownloadStream from "./downloadStream";
import Metadata from "./metadata";
const { createWriteStream } = streamSaver;
import Config from "./config";
import { IDownloadStream } from "./interfaces/IDownloadStream";

export default class DownloadFile {
    private readonly metadata: Metadata;
    private readonly cipher: Cipher;
    private readonly stream: IDownloadStream;
    private stop: boolean;

    public constructor(
        id: string,
        sharing: string,
        metadata: Metadata,
        cipher: Cipher,
        startFrom: number
    ) {
        this.metadata = metadata;
        this.cipher = cipher;
        const size = this.lengthEncryptedFile(startFrom);
        this.stream = sharing
            ? new DownloadStream(id, startFrom, size, { sharing }) // dbx
            : new DownloadStream(id, startFrom, size); // server
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
            let chunk = await this.stream.read();

            while (!chunk.done) {
                if (this.stop) {
                    await writer.abort("Cancel");
                    window.onunload = null;
                    return;
                }

                const decrypted = await this.cipher.decryptChunk(chunk.value);
                await writer.write(decrypted);
                progress(decrypted.length);
                chunk = await this.stream.read();
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
            let chunk = await this.stream.read();

            while (!chunk.done) {
                const decrypted = await this.cipher.decryptChunk(chunk.value);
                blob = new Blob([blob, decrypted], {
                    type: "application/octet-stream"
                });
                progress(decrypted.length);
                chunk = await this.stream.read();
            }
        } catch (e) {
            throw e;
        }

        saveAs(blob, this.metadata.getName());
    }

    /**
     * It calculates length of encrypted content of file
     *
     * @param startFrom - first position of encrypted file
     * @return length of encrypted file
     */
    private lengthEncryptedFile(startFrom: number): number {
        const size = this.metadata.getSize();
        const count = Math.floor(size / Config.client.chunkSize);
        return (
            startFrom +
            count * (Config.client.chunkSize + 16) +
            (size - count * Config.client.chunkSize) +
            16
        );
    }
}
