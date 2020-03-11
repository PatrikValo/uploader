import uuid from "uuid/v1";
import AuthDropbox from "./authDropbox";
import { Cipher, ClassicCipher, PasswordCipher } from "./cipher";
import FileStream from "./fileStream";
import IUploadFile from "./interfaces/IUploadFile";
import Metadata from "./metadata";
import Utils from "./utils";

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

    /**
     * It exports the key, which was used for encryption
     *
     * @return empty string - if key was derived from password
     *          exported key - otherwise
     */
    protected async exportKey(): Promise<string> {
        if (this.password) {
            return "";
        }

        return await this.cipher.exportedKey();
    }

    /**
     * Each time when this method is called, it returns part of file or
     * metadata (iv, flag, ..., file's metadata), which should be send to server next.
     * Progress is executed when metadata was sent and file is currently read.
     * Progress is executed with length of chunk before encryption.
     * @param progress
     * @return null - there is nothing to read from file
     *         data - otherwise
     */
    protected async content(
        progress: (u: number) => any
    ): Promise<Uint8Array | null> {
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

    /**
     * It returns initialisation vector, which is used for encryption.
     *
     * @return iv
     */
    private createIv(): Promise<Uint8Array> {
        return this.cipher.getInitializationVector();
    }

    /**
     * It returns flag. Length of flag is 1. If key was derived from
     * password, flag contains 1. Flag contains 0, otherwise.
     *
     * @return flag
     */
    private createFlag(): Promise<Uint8Array> {
        return new Promise(resolve => {
            const flags = new Uint8Array(1);
            flags[0] = this.password ? 1 : 0;
            return resolve(flags);
        });
    }

    /**
     * It returns salt, which was used for deriving the key from password. If
     * password wasn't available, salt contains only zeros.
     *
     * @return salt
     */
    private async createSalt(): Promise<Uint8Array> {
        return await this.cipher.getSalt();
    }

    /**
     * It returns encrypted metadata with its length.
     *
     * @return length joins with metadata
     */
    private async createMetadata(): Promise<Uint8Array> {
        const metadata = await this.cipher.encryptMetadata(this.metadata);
        const length: Uint8Array = Metadata.lengthToUint8Array(metadata.length);

        const m = new Uint8Array(length.length + metadata.length);
        m.set(length);
        m.set(metadata, length.length);
        return m;
    }

    /**
     * It returns encrypted chunk of file and progress is executed with length
     * of chunk before encryption. Method returns null, if there is nothing
     * to read from file.
     *
     * @param progress
     * @return null - whole file was returned in previous callings of this method
     *         chunk - otherwise
     */
    private async createChunk(
        progress: (u: number) => any
    ): Promise<Uint8Array | null> {
        const chunk = await this.fileStream.read();
        const uploaded = chunk.value.length;
        progress(uploaded); // users function

        if (!chunk.done) {
            return await this.cipher.encryptChunk(chunk.value);
        }

        return null;
    }
}

export class UploadFileServer extends UploadFile {
    private readonly url: string;
    private id: string = "";

    public constructor(file: File, password?: string) {
        super(file, password);
        this.url = Utils.serverWebsocketUrl("/api/upload");
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
                    const answer = await this.content(progress);

                    if (!answer) {
                        return socket.send("null");
                    }

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

export class UploadFileXHR extends UploadFile {
    public constructor(file: File, password?: string) {
        super(file, password);
    }

    public async upload(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }> {
        return new Promise(async (resolve, reject) => {
            try {
                const idObj = await this.post(
                    Utils.serverClassicUrl("/api/upload"),
                    [],
                    new Uint8Array(0)
                );

                let answer = await this.content(progress);

                while (answer) {
                    if (this.isCanceled()) {
                        return resolve({ id: "", key: "" });
                    }

                    await this.post(
                        Utils.serverClassicUrl("/api/upload/" + idObj.id),
                        [
                            {
                                header: "Content-Type",
                                value: "application/octet-stream"
                            }
                        ],
                        answer
                    );

                    answer = await this.content(progress);
                }

                return resolve({ id: idObj.id, key: await this.exportKey() });
            } catch (e) {
                return reject(e);
            }
        });
    }

    private post(
        url: string,
        headers: Array<{ header: string; value: string }>,
        body: Uint8Array
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    return reject(new Error(String(xhr.status)));
                }

                return resolve(xhr.response);
            };

            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.open("post", url);

            headers.forEach(value => {
                xhr.setRequestHeader(value.header, value.value);
            });

            xhr.responseType = "json";
            xhr.send(body);
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

            let content = await this.content(progress);
            let uploaded: number = 0;

            while (content !== null) {
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
                content = await this.content(progress);
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
