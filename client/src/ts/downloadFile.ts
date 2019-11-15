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

    public constructor(
        id: string,
        metadata: Metadata,
        key: string,
        iv: Uint8Array
    ) {
        this.id = id;
        this.metadata = metadata;
        this.cipher = new Cipher(key, iv);
    }

    public async download() {
        const url = Utils.server.classicUrl("/api/download/" + this.id);
        const stream = new ReadableStream(new DownloadStream(url));
        const reader = stream.getReader();
        await this.downloadStream(reader);
    }

    private async downloadBlob(reader: ReadableStreamDefaultReader) {
        let chunk = await reader.read();
        let blobArray: BlobPart[] = [];
        while (!chunk.done) {
            const decrypted = await this.cipher.decryptChunk(chunk.value);
            const arr = [].slice.call(decrypted);
            blobArray = blobArray.concat(arr);
            chunk = await reader.read();
        }

        saveAs(new Blob(blobArray), this.metadata.name);
    }

    private async downloadStream(reader: ReadableStreamDefaultReader) {
        const writeStream: WritableStream = createWriteStream(
            this.metadata.name,
            {
                size: this.metadata.size
            },
            this.metadata.size
        );

        const writer = writeStream.getWriter();

        this.initAbortEvent(writer);

        let chunk = await reader.read();
        while (!chunk.done) {
            const decrypted = await this.cipher.decryptChunk(chunk.value);
            await writer.write(decrypted);
            chunk = await reader.read();
        }

        await writer.close();

        this.termAbortEvent();
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
