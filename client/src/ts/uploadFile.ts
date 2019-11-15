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

    public constructor(file: File, url: string) {
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

                if (msg.hasOwnProperty("id")) {
                    this.id = msg.id;
                    return socket.close();
                }

                if (msg.hasOwnProperty("nextElement")) {
                    const nextEl = msg.nextElement;

                    if (nextEl === "iv") {
                        const iv = this.cipher.initializationVector();
                        return socket.send(iv);
                    }

                    if (nextEl === "metadata") {
                        const metadata = await this.cipher.encryptMetadata(
                            this.metadata
                        );
                        return socket.send(metadata);
                    }

                    return socket.close();
                }

                if (msg.status !== 200) {
                    return socket.close();
                }

                const chunk = await reader.read();
                const uploaded = chunk && chunk.value ? chunk.value.length : 0;
                progress(uploaded); // users function

                if (!chunk.done) {
                    const value = new Uint8Array(chunk.value);
                    const encrypted = await this.cipher.encryptChunk(value);
                    return socket.send(encrypted);
                }

                return socket.send("null");
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
}
