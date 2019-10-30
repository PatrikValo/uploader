import FileStream from "./fileStream";
import Metadata from "./metadata";

export default class UploadFile {
    private static createIV(size: number = 16): Uint8Array {
        // TODO if (!window.crypto)... move to Crypto class as static class
        return window.crypto.getRandomValues(new Uint8Array(size));
    }

    private static createMetadata(file: File): Uint8Array {
        const md: Metadata = new Metadata(file);
        return md.toUint8Array();
    }

    private readonly iv: Uint8Array;
    private readonly meta: Uint8Array;
    private readonly url: string;
    private fileStream: FileStream;
    private stop: boolean = false;
    private id: string = "";

    public constructor(file: File, url: string) {
        this.fileStream = new FileStream(file);
        this.iv = UploadFile.createIV(16);
        this.meta = UploadFile.createMetadata(file);
        this.url = url;
    }

    public async send(progress: (u: number) => any): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const socket = new WebSocket(this.url);

            socket.onmessage = async (event: MessageEvent) => {
                if (this.stop) {
                    return socket.close();
                }

                const msg = JSON.parse(event.data);

                if (msg.hasOwnProperty("id")) {
                    this.id = msg.id;
                    return socket.close();
                }

                if (msg.hasOwnProperty("nextElement")) {
                    const nextEl = msg.nextElement;

                    if (nextEl === "iv") {
                        return socket.send(this.iv);
                    }

                    if (nextEl === "metadata") {
                        return socket.send(this.meta);
                    }

                    return socket.close();
                }

                if (msg.status !== 200) {
                    return socket.close();
                }

                progress(chunk.value.length); // users function

                if (!chunk.done) {
                    const value = chunk.value;
                    chunk = await this.fileStream.read();
                    return socket.send(value);
                }

                return socket.send("null");
            };

            socket.onclose = () => {
                if (this.stop) {
                    return resolve("");
                }
                return this.id ? resolve(this.id) : reject();
            };

            socket.onerror = reject;

            let chunk = await this.fileStream.read();
        });
    }

    public cancel(): void {
        this.stop = true;
    }
}
