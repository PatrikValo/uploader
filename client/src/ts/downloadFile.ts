import { WritableStream } from "web-streams-polyfill/ponyfill/es6";
import streamSaver from "../js/StreamSaver";

export default class DownloadFile {
    private readonly id: string;
    private readonly name: string;
    private readonly size: number;

    public constructor(id: string, name: string, size: number) {
        this.id = id;
        this.name = name;
        this.size = size;
    }

    public async download() {
        const response: Response = await fetch(
            "http://localhost:9998/api/download/" + this.id,
            { method: "get" }
        );

        if (!response.body) {
            throw new Error("Response Error");
        }

        const stream: ReadableStream<Uint8Array> = response.body;

        streamSaver.WritableStream = WritableStream; // firefox

        const writeStream: WritableStream = streamSaver.createWriteStream(
            this.name,
            {
                size: this.size
            },
            this.size
        );

        const reader = stream.getReader();
        const writer = writeStream.getWriter();

        let state = await reader.read();
        while (!state.done) {
            await writer.write(state.value);
            state = await reader.read();
        }
        await writer.close();
    }
}
