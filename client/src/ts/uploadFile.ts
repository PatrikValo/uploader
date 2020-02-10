import { Cipher, ClassicCipher, PasswordCipher } from "./cipher";
import FileStream from "./fileStream";
import Metadata from "./metadata";
import Utils from "./utils";

function lengthOfMetadata(n: number): Uint8Array {
    const hex = n.toString(16);
    const len = hex.length;

    if (len > 4) {
        throw new Error("Metadata is too long");
    }

    if (len <= 2) {
        return new Uint8Array([0, n]);
    }

    if (len === 3) {
        return new Uint8Array([
            parseInt(hex[0], 16),
            parseInt(hex.slice(1, 3), 16)
        ]);
    }

    return new Uint8Array([
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16)
    ]);
}

export default class UploadFile {
    private readonly cipher: Cipher;
    private readonly fileStream: FileStream;
    private readonly metadata: Metadata;
    private readonly password: boolean;
    private readonly url: string;
    private stop: boolean = false;
    private id: string = "";
    private sendIv = false;
    private sendFlag = false;
    private sendSalt = false;
    private sendMetadata = false;

    public constructor(file: File, password?: string) {
        this.cipher = password
            ? new PasswordCipher(password)
            : new ClassicCipher();
        this.fileStream = new FileStream(file);
        this.metadata = new Metadata(file);
        this.password = !!password;
        this.url = Utils.server.websocketUrl("/api/upload");
    }

    public async upload(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }> {
        return new Promise(async (resolve, reject) => {
            const socket = new WebSocket(this.url);

            socket.onmessage = async (event: MessageEvent) => {
                if (this.stop) {
                    return socket.close();
                }

                const msg = JSON.parse(event.data);

                try {
                    const answer = await this.message(msg, progress);

                    if (answer === null) {
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
                    return resolve({ id: "", key: "" });
                }

                let key: string = "";

                if (!this.password) {
                    key = await this.cipher.exportedKey();
                }

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
        progress: (u: number) => any
    ): Promise<null | Uint8Array | string> {
        if (msg.id) {
            this.id = msg.id;
            return null;
        }

        if (msg.status !== 200) {
            return null;
        }

        if (!this.sendIv) {
            return this.createIv();
        }

        if (!this.sendFlag) {
            return this.createFlag();
        }

        if (!this.sendSalt) {
            return this.createSalt();
        }

        if (!this.sendMetadata) {
            return this.createMetadata();
        }

        return this.createChunk(progress);
    }

    private createIv(): Uint8Array {
        this.sendIv = true;
        return this.cipher.initializationVector();
    }

    private createFlag(): Uint8Array {
        this.sendFlag = true;
        const flags = new Uint8Array(1);
        flags[0] = this.password ? 1 : 0;
        return flags;
    }

    private async createSalt(): Promise<Uint8Array> {
        this.sendSalt = true;
        return await this.cipher.getSalt();
    }

    private async createMetadata(): Promise<Uint8Array> {
        this.sendMetadata = true;
        const metadata = await this.cipher.encryptMetadata(this.metadata);
        const length: Uint8Array = lengthOfMetadata(metadata.length);

        const m = new Uint8Array(length.length + metadata.length);
        m.set(length);
        m.set(metadata, length.length);
        return m;
    }

    private async createChunk(
        progress: (u: number) => any
    ): Promise<Uint8Array | string> {
        const chunk = await this.fileStream.read();
        const uploaded = chunk.value.length;
        progress(uploaded); // users function

        if (!chunk.done) {
            return await this.cipher.encryptChunk(chunk.value);
        }

        return "null";
    }
}
