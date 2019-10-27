import streamSaver from "../js/StreamSaver";

export default class DownloadFile {
    private readonly _id: string;
    private readonly _name: string;

    public constructor(id: string, name: string, size?: number) {
        this._id = id;
        this._name = name;
    }

    /*public downloadBlob() {
        console.log("OK");
        const xhr: XMLHttpRequest = new XMLHttpRequest();

        xhr.onprogress = function(event) {
            console.log(event.loaded, xhr);
        };

        xhr.open("get", "http://localhost:3000/api/download/" + this._id);
        xhr.responseType = "arraybuffer";
        xhr.send();
    }*/

    public async downloadStream(progress: (n: number) => any) {
        const response: Response = await fetch(
            "http://localhost:9998/api/download/" + this._id,
            { method: "get" }
        );

        if (!response.body) {
            throw new Error("Response Error");
        }

        const stream: ReadableStream<Uint8Array> = response.body;
        const fileStream = streamSaver.createWriteStream(
            this._name,
            {
                size: 85
            },
            0
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
