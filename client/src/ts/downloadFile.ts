import { WritableStream } from "web-streams-polyfill/ponyfill/es6";
import streamSaver from "../js/StreamSaver";

export default class DownloadFile {
    private readonly _id: string;
    private readonly _name: string;
    private readonly _size: number;

    public constructor(id: string, name: string, size: number) {
        this._id = id;
        this._name = name;
        this._size = size;
    }

    public async download() {
        const response: Response = await fetch(
            "http://localhost:9998/api/download/" + this._id,
            { method: "get" }
        );

        if (!response.body) {
            throw new Error("Response Error");
        }

        const stream: ReadableStream<Uint8Array> = response.body;

        streamSaver.WritableStream = WritableStream; // firefox
        const fileStream = streamSaver.createWriteStream(
            this._name,
            {
                size: this._size
            },
            this._size
        );
        const reader = stream.getReader();
        const writer = fileStream.getWriter();

        let state = await reader.read();
        while (!state.done) {
            await writer.write(state.value);
            state = await reader.read();
        }
        await writer.close();
    }
}
