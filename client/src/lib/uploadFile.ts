import Metadata from "./metadata";
import FileStream from "./fileStream";

export default class UploadFile {
    private readonly _file: File;
    private _stop: boolean = false;
    private readonly _url: string;

    public constructor(file: File, url: string) {
        this._file = file;
        this._url = url;
    }

    // TODO progress and fileStream can throw e maybe create new private method
    public async send(_progress: (u: number) => any) {
        const iv = window.crypto.getRandomValues(new Uint8Array(16)); // initialisation vector

        const m: Metadata = new Metadata(
            this._file.name,
            this._file.type,
            this._file.size
        );
        const metadata: Uint8Array = m.toUint8Array(); // metadata

        let fileStream: FileStream = new FileStream(this._file); // fileStream

        const socket = new WebSocket(this._url);

        let chunk = await fileStream.read();
        let id: string;

        return new Promise<string>((resolve, reject) => {
            socket.onmessage = async (event: MessageEvent) => {
                if (this._stop) return socket.close(); // stop communication because user want to stop uploading

                const msg = JSON.parse(event.data);

                if (msg.hasOwnProperty("id")) {
                    id = msg.id;
                    return socket.close();
                }

                if (msg.hasOwnProperty("nextElement")) {
                    if (msg.nextElement == "iv") return socket.send(iv);
                    if (msg.nextElement == "metadata")
                        return socket.send(metadata);
                    return socket.close();
                }

                if (msg.status != 200) return socket.close();

                if (!chunk.done) {
                    const value = chunk.value;
                    chunk = await fileStream.read();
                    return socket.send(value);
                }

                return socket.send("null");
            };

            socket.onclose = () => {
                if (id) return resolve(id);
                return reject();
            };

            socket.onerror = reject;
        });
    }

    public cancel(): void {
        this._stop = true;
    }
}
