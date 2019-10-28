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
        this._iv = UploadFile.createIV(16);
        this._meta = UploadFile.createMetadata(file);
        this._url = url;
    }

    private static createIV(size: number = 16): Uint8Array {
        // TODO if (!window.crypto)... move to Crypto class as static class
        return window.crypto.getRandomValues(new Uint8Array(size));
    }

    private static createMetadata(file: File): Uint8Array {
        const md: Metadata = new Metadata(file);
        return md.toUint8Array();
    }

    public async send(progress: (u: number) => any): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            // TODO this can throw ERR_CONNECTION_REFUSED but it isn't catchable
            const socket = new WebSocket(this._url);

            socket.onmessage = async (event: MessageEvent) => {
                if (this._stop) return socket.close();

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
                if (this._stop) return resolve("");
                return this._id ? resolve(this._id) : reject();
            };

            socket.onerror = reject;

            let chunk = await this._fileStream.read();
        });
    }

    public cancel(): void {
        this._stop = true;
    }
}
