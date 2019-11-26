import { saveAs } from "file-saver";
import streamSaver from "streamsaver";
import { WritableStream } from "web-streams-polyfill/ponyfill";
import Cipher from "./cipher";
import DownloadStream from "./downloadStream";
import Metadata from "./metadata";
import Utils from "./utils";
const { createWriteStream } = streamSaver;
streamSaver.WritableStream = WritableStream; // firefox

export default class DownloadFile {
    private readonly id: string;
    private readonly metadata: Metadata;
    private readonly cipher: Cipher;
    private readonly stream: DownloadStream;

    public constructor(
        id: string,
        metadata: Metadata,
        key: string,
        iv: Uint8Array
    ) {
        this.id = id;
        this.metadata = metadata;
        this.cipher = new Cipher(key, iv);
        const url = Utils.server.classicUrl("/api/download/" + this.id);
        this.stream = new DownloadStream(url);
    }

    public async download(progress?: (u: number) => any) {
        return await this.downloadStream();
    }

    private async downloadStream() {
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

    /**
     * Set function, which abort writer when window in browser is closed
     * @param writer
     */
    private initAbortEvent(writer: WritableStreamDefaultWriter<any>): void {
        window.onunload = async () => {
            await writer.abort("Close window");
        };
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Unset function for abort writer when window is closed
     */
    private termAbortEvent(): void {
        window.onunload = null;
    }
}
