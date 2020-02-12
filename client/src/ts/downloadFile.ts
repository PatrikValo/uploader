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
    }

    public async download(blob: boolean, progress: (u: number) => any) {
        if (!blob) {
            return await this.downloadStream(progress);
        }

        return await this.downloadBlob(progress);
    }

    private async downloadStream(progress: (u: number) => any) {
        streamSaver.TransformStream = TransformStream;
        streamSaver.WritableStream = WritableStream;

        const writeStream: WritableStream = createWriteStream(
            this.metadata.name,
            {
                size: this.metadata.size
            },
            this.metadata.size
        );

        const writer = writeStream.getWriter();

        this.initAbortEvent(writer);

        try {
            let chunk = await this.stream.read();

            while (!chunk.done) {
                const decrypted = await this.cipher.decryptChunk(chunk.value);
                await writer.write(decrypted);
                progress(decrypted.length);
                chunk = await this.stream.read();
            }
        } catch (e) {
            // stop download window in browser
            await writer.abort("Exception");
            this.termAbortEvent();

            throw e;
        }

        await writer.close();

        this.termAbortEvent();
    }

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

        saveAs(blob, this.metadata.name);
    }

    private initAbortEvent(writer: WritableStreamDefaultWriter<any>): void {
        window.onunload = async () => {
            await writer.abort("Close window");
        };
    }

    // noinspection JSMethodCanBeStatic
    private termAbortEvent(): void {
        window.onunload = null;
    }
}
