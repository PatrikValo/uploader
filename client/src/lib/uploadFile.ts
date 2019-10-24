import Metadata from "./metadata";
import FileStream from "./fileStream";

export default class UploadFile {
    private _fileStream: FileStream;
    private readonly _iv: Uint8Array;
    private readonly _meta: Uint8Array;
    private readonly _url: string;
    private _stop: boolean = false;
    private _id: string = "";

    public constructor(file: File, url: string) {
        this._fileStream = new FileStream(file);
        this._iv = window.crypto.getRandomValues(new Uint8Array(16));
        const md: Metadata = new Metadata(file);
        this._meta = md.toUint8Array();
        this._url = url;
    }

    // TODO fileStream can throw e
    public async send(progress: (u: number) => any) {
        const socket = new WebSocket(this._url);

        return new Promise<string>(async (resolve, reject) => {
            let chunk = await this._fileStream.read();

            socket.onmessage = async (event: MessageEvent) => {
                if (this._stop) return socket.close(); // it calls reject, because ID doesn't exist

                const msg = JSON.parse(event.data);

                if (msg.hasOwnProperty("id")) {
                    this._id = msg.id;
                    return socket.close();
                }

                if (msg.hasOwnProperty("nextElement")) {
                    const nextEl = msg.nextElement;
                    if (nextEl == "iv") return socket.send(this._iv);
                    if (nextEl == "metadata") return socket.send(this._meta);
                    return socket.close();
                }

                if (msg.status != 200) return socket.close();

                progress(chunk.value.length); // users function

                if (!chunk.done) {
                    const value = chunk.value;
                    chunk = await this._fileStream.read();
                    return socket.send(value);
                }

                return socket.send("null");
            };

            socket.onclose = () => {
                return this._id ? resolve(this._id) : reject();
            };

            socket.onerror = reject;
        });
    }

    public cancel(): void {
        this._stop = true;
    }
}
