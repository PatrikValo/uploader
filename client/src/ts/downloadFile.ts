import streamSaver from "streamsaver";
const { createWriteStream } = streamSaver;
import {
    WritableStream,
    WritableStreamDefaultWriter
} from "web-streams-polyfill/ponyfill/es6";
import Utils from "./utils";
streamSaver.WritableStream = WritableStream; // firefox

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
        const url = Utils.server.classicUrl("/api/download/" + this.id);
        const response: Response = await fetch(url, { method: "get" });

        if (!response.body) {
            throw new Error("Response Error");
        }

        const stream: ReadableStream<Uint8Array> = response.body;

        const writeStream: WritableStream = createWriteStream(
            this.name,
            {
                size: this.size
            },
            this.size
        );

        const reader = stream.getReader();
        const writer = writeStream.getWriter();

        this.initDownload(writer);

        let state = await reader.read();
        while (!state.done) {
            await writer.write(state.value);
            state = await reader.read();
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
