import streamSaver from "streamsaver";
const { createWriteStream } = streamSaver;
import { WritableStream, WritableStreamDefaultWriter } from "web-streams-polyfill/ponyfill/es6";
import Cipher from "./cipher";
import Metadata from "./metadata";
import Utils from "./utils";
streamSaver.WritableStream = WritableStream; // firefox

export default class DownloadFile {
    private readonly id: string;
    private readonly metadata: Metadata;
    private readonly cipher: Cipher;

    public constructor(id: string, metadata: Metadata, key: string, iv: Uint8Array) {
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

        const stream: ReadableStream<Uint8Array> = response.body;

        const writeStream: WritableStream = createWriteStream(
            this.metadata.name,
            {
                size: this.metadata.size
            },
            this.metadata.size
        );

        const reader = stream.getReader();
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

    private initDownload(writer: WritableStreamDefaultWriter<any>): void {
        window.onunload = async () => {
            await writer.abort("Close window");
        };

        window.onbeforeunload = (e: BeforeUnloadEvent) => {
            e.returnValue = "Are you sure you want to close window?";
        };
    }

    // noinspection JSMethodCanBeStatic
    private termDownload(): void {
        window.onunload = null;
        window.onbeforeunload = null;
    }
}
