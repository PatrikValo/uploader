import { saveAs } from "file-saver";
import streamSaver from "streamsaver";
import {
    WritableStream,
    WritableStreamDefaultController
} from "web-streams-polyfill/ponyfill";
const { createWriteStream } = streamSaver;
import Cipher from "./cipher";
import Metadata from "./metadata";
import TransformStream from "./transformStream";
import Utils from "./utils";
streamSaver.WritableStream = WritableStream; // firefox

export default class DownloadFile {
    private readonly id: string;
    private readonly metadata: Metadata;
    private readonly cipher: Cipher;
    private readonly blob: boolean = false;

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
        const response: Response = await fetch(url, { method: "get" });

        if (!response.body) {
            throw new Error("Response Error");
        }

        const reader = response.body.getReader();

        if (this.blob) {
            return await this.downloadBlob(reader);
        }

        return await this.downloadStream(reader);
    }

    private initDownload(writer: WritableStreamDefaultWriter<any>): void {
        window.onunload = async () => {
            await writer.abort("Close window");
        };
    }

    // noinspection JSMethodCanBeStatic
    private termDownload(): void {
        window.onunload = null;
    }

    private async downloadBlob(reader: ReadableStreamDefaultReader) {
        let chunk = await reader.read();
        const blobArray: BlobPart[] = [];
        while (!chunk.done) {
            const decrypted = await this.cipher.decryptChunk(chunk.value);
            const arr = [].slice.call(decrypted);
            blobArray.concat(arr);
            chunk = await reader.read();
        }

        saveAs(new Blob(blobArray), this.metadata.name);
    }

    private async downloadStream(resReader: ReadableStreamDefaultReader) {
        const transformer = new ReadableStream(new TransformStream(resReader));
        const reader = transformer.getReader();

        const writeStream: WritableStream = createWriteStream(
            this.metadata.name,
            {
                size: this.metadata.size
            },
            this.metadata.size
        );

        const writer = writeStream.getWriter();

        this.initDownload(writer);

        let chunk = await reader.read();
        while (!chunk.done) {
            const decrypted = await this.cipher.decryptChunk(chunk.value);
            await writer.write(decrypted);
            chunk = await reader.read();
        }

        await writer.close();

        this.termDownload();
    }
}
