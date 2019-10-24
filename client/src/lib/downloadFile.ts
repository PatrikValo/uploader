// import * as streamSaver from "./StreamSaver";

export default class DownloadFile {
    private readonly _id: string;

    public constructor(id: string) {
        this._id = id;
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

    public async downloadStream(progress: (n: number) => number | null) {
        const response: Response = await fetch(
            "http://localhost:9998/api/download/" + this._id,
            { method: "get" }
        );

        if (!response.body) {
            throw new Error("Response Error");
        }

        const stream: ReadableStream<Uint8Array> = response.body;
        const reader = stream.getReader();

        let state = await reader.read();
        while (!state.done) {
            console.log(state.value);
            state = await reader.read();
        }
    }
}
