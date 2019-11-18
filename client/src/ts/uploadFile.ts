import Cipher from "./cipher";
import FileStream from "./fileStream";
import Metadata from "./metadata";

export default class UploadFile {
    private readonly fileStream: ReadableStream;
    private readonly cipher: Cipher;
    private readonly metadata: Metadata;
    private readonly url: string;
    private stop: boolean = false;
    private id: string = "";

    public constructor(file: File, url: string, password?: string) {
        this.fileStream = new ReadableStream(new FileStream(file));
        this.cipher = new Cipher();
        this.metadata = new Metadata(file);
        this.url = url;
    }

    public async upload(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }> {
        return new Promise(async (resolve, reject) => {
            const socket = new WebSocket(this.url);
            const reader = this.fileStream.getReader();

            socket.onmessage = async (event: MessageEvent) => {
                if (this.stop) {
                    return socket.close();
                }

                const msg = JSON.parse(event.data);

                try {
                    const answer = await this.message(msg, reader, progress);

                    if (!answer) {
                        return socket.close();
                    }

                    return socket.send(answer);
                } catch (e) {
                    // close socket connection and there is thrown exception because id is not received
                    return socket.close();
                }
            };

            socket.onclose = async () => {
                if (this.stop) {
                    await reader.cancel();
                    return resolve({ id: "", key: "" });
                }
                const key = await this.cipher.exportedKey();
                return this.id
                    ? resolve({ id: this.id, key })
                    : reject(new Error("Websocket problem"));
            };

            socket.onerror = reject;
        });
    }

    public cancel(): void {
        this.stop = true;
    }

    private async message(
        msg: any,
        reader: ReadableStreamReader,
        progress: (u: number) => any
    ): Promise<null | Uint8Array | string> {
        if (msg.hasOwnProperty("id")) {
            this.id = msg.id;
            return null;
        }

        if (msg.hasOwnProperty("nextElement")) {
            const nextEl = msg.nextElement;

            if (nextEl === "iv") {
                return this.cipher.initializationVector();
            }

            if (nextEl === "metadata") {
                return await this.cipher.encryptMetadata(this.metadata);
            }

            return null;
        }

        if (msg.status !== 200) {
            return null;
        }

        const chunk = await reader.read();
        const uploaded = chunk && chunk.value ? chunk.value.length : 0;
        progress(uploaded); // users function

        if (!chunk.done) {
            const value = new Uint8Array(chunk.value);
            return await this.cipher.encryptChunk(value);
        }

        return "null";
    }
}
