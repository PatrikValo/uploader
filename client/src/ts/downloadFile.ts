import { saveAs } from "file-saver";
import streamSaver from "streamsaver";
import AuthDropbox from "./authDropbox";
import { Cipher } from "./cipher";
import { DownloadStreamDropbox, DownloadStreamServer } from "./downloadStream";
import Metadata from "./metadata";
const { createWriteStream } = streamSaver;
import { IDownloadStream } from "./interfaces/IDownloadStream";

export default class DownloadFile {
    private readonly id: string;
    private readonly metadata: Metadata;
    private readonly cipher: Cipher;
    private readonly stream: IDownloadStream;
    private stop: boolean;

    public constructor(
        id: string,
        metadata: Metadata,
        cipher: Cipher,
        startFrom: number,
        auth: AuthDropbox
    ) {
        this.id = id;
        this.metadata = metadata;
        this.cipher = cipher;
        this.stream = auth.isLoggedIn()
            ? new DownloadStreamDropbox(this.id, startFrom, auth)
            : new DownloadStreamServer(this.id, startFrom);
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
}
