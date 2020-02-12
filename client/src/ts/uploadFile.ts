import uuid from "uuid/v1";
import AuthDropbox from "./authDropbox";
import { Cipher, ClassicCipher, PasswordCipher } from "./cipher";
import FileStream from "./fileStream";
import IUploadFile from "./interfaces/IUploadFile";
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

abstract class UploadFile implements IUploadFile {
    private readonly cipher: Cipher;
    private readonly fileStream: FileStream;
    private readonly metadata: Metadata;
    private readonly password: boolean;
    private stop: boolean = false;
    private sendIv = false;
    private sendFlag = false;
    private sendSalt = false;
    private sendMetadata = false;

    protected constructor(file: File, password?: string) {
        this.cipher = password
            ? new PasswordCipher(password)
            : new ClassicCipher();
        this.fileStream = new FileStream(file);
        this.metadata = new Metadata(file);
        this.password = !!password;
    }

    public abstract upload(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }>;

    public cancel(): void {
        this.stop = true;
    }

    public isCanceled(): boolean {
        return this.stop;
    }

    protected async exportKey(): Promise<string> {
        if (this.password) {
            return "";
        }

        return await this.cipher.exportedKey();
    }

    protected async message(
        progress: (u: number) => any
    ): Promise<Uint8Array | string> {
        if (!this.sendIv) {
            this.sendIv = true;
            return this.createIv();
        }

        if (!this.sendFlag) {
            this.sendFlag = true;
            return this.createFlag();
        }

        if (!this.sendSalt) {
            this.sendSalt = true;
            return this.createSalt();
        }

        if (!this.sendMetadata) {
            this.sendMetadata = true;
            return this.createMetadata();
        }

        return this.createChunk(progress);
    }

    private createIv(): Promise<Uint8Array> {
        return new Promise(resolve => {
            return resolve(this.cipher.initializationVector());
        });
    }

    private createFlag(): Promise<Uint8Array> {
        return new Promise(resolve => {
            const flags = new Uint8Array(1);
            flags[0] = this.password ? 1 : 0;
            return resolve(flags);
        });
    }

    private async createSalt(): Promise<Uint8Array> {
        return await this.cipher.getSalt();
    }

    private async createMetadata(): Promise<Uint8Array> {
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

export class UploadFileServer extends UploadFile {
    private readonly url: string;
    private id: string = "";

    public constructor(file: File, password?: string) {
        super(file, password);
        this.url = Utils.server.websocketUrl("/api/upload");
    }

    public async upload(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }> {
        return new Promise(async (resolve, reject) => {
            const socket = new WebSocket(this.url);

            socket.onmessage = async (event: MessageEvent) => {
                if (this.isCanceled()) {
                    return socket.close();
                }

                const msg = JSON.parse(event.data);

                if (msg.id) {
                    this.id = msg.id;
                    return socket.close();
                }

                if (msg.status !== 200) {
                    return socket.close();
                }

                try {
                    const answer = await this.message(progress);
                    return socket.send(answer);
                } catch (e) {
                    // close socket connection and there is thrown exception because id is not received
                    return socket.close();
                }
            };

            socket.onclose = async () => {
                if (this.isCanceled()) {
                    return resolve({ id: "", key: "" });
                }

                return this.id
                    ? resolve({ id: this.id, key: await this.exportKey() })
                    : reject(
                          new Error(
                              "An error occurred during uploading of file"
                          )
                      );
            };

            socket.onerror = () => {
                return reject(
                    new Error("An error occurred during websocket connection")
                );
            };
        });
    }
}

export class UploadFileDropbox extends UploadFile {
    private auth: AuthDropbox;

    public constructor(file: File, auth: AuthDropbox, password?: string) {
        super(file, password);
        this.auth = auth;
    }

    public async upload(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }> {
        const dbx = this.auth.getDropboxObject();

        try {
            const id = (await dbx.filesUploadSessionStart({
                close: false,
                contents: new Uint8Array(0)
            })).session_id;

            let content = await this.message(progress);
            let uploaded: number = 0;

            while (content !== "null") {
                if (this.isCanceled()) {
                    await dbx.filesUploadSessionAppendV2({
                        close: true,
                        contents: new Uint8Array(0),
                        cursor: {
                            contents: Object,
                            offset: uploaded,
                            session_id: id
                        }
                    });

                    return { id: "", key: "" };
                }

                await dbx.filesUploadSessionAppendV2({
                    close: false,
                    contents: content,
                    cursor: {
                        contents: Object,
                        offset: uploaded,
                        session_id: id
                    }
                });
                uploaded += content.length;
                content = await this.message(progress);
            }

            const filename = uuid().replace(/-/g, "");
            const metadata = await dbx.filesUploadSessionFinish({
                commit: {
                    autorename: true,
                    contents: Object,
                    path: "/" + filename
                },
                contents: new Uint8Array(0),
                cursor: {
                    contents: Object,
                    offset: uploaded,
                    session_id: id
                }
            });

            return { id: metadata.name, key: await this.exportKey() };
        } catch (e) {
            if (e instanceof Error) {
                throw e;
            }

            throw new Error("An error occurred during uploading of file");
        }
    }
}
