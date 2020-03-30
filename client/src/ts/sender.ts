import uuid from "uuid/v1";
import AuthDropbox from "./authDropbox";
import ISender from "./interfaces/iSender";
import UploadSource from "./uploadSource";
import Utils from "./utils";

export class SenderServer implements ISender {
    private id: string = "";
    private readonly source: UploadSource;
    private stop: boolean = false;

    public constructor(source: UploadSource) {
        this.source = source;
    }

    public cancel(): void {
        this.stop = true;
    }

    public async send(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }> {
        return new Promise(async (resolve, reject) => {
            const socket = new WebSocket(
                Utils.serverWebsocketUrl("/api/upload")
            );

            socket.onmessage = async (event: MessageEvent) => {
                if (this.stop) {
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
                    const answer = await this.source.getContent(progress);
                    if (!answer) {
                        return socket.send("null");
                    }
                    return socket.send(answer);
                } catch (e) {
                    return socket.close();
                }
            };

            socket.onclose = async () => {
                if (this.stop) {
                    return resolve({ id: "", key: "" });
                }
                const key = await this.source.exportKey();
                return this.id
                    ? resolve({ id: this.id, key })
                    : reject(new Error("An error occurred during uploading"));
            };

            socket.onerror = () => {
                return reject(new Error("An error occurred during websocket"));
            };
        });
    }
}

export class SenderDropbox implements ISender {
    private readonly source: UploadSource;
    private readonly auth: AuthDropbox;
    private readonly sessionPromise: Promise<string>;
    private stop: boolean = false;

    public constructor(source: UploadSource, auth: AuthDropbox) {
        this.source = source;
        this.auth = auth;
        this.sessionPromise = this.createSessionId();
    }

    public cancel(): void {
        this.stop = true;
    }

    public async send(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }> {
        try {
            let content = await this.source.getContent(progress);
            let uploaded: number = 0;

            while (content !== null) {
                // stop uploading
                if (this.stop) {
                    await this.upload(uploaded, new Uint8Array(0), true);
                    return { id: "", key: "" };
                }

                await this.upload(uploaded, content);
                uploaded += content.length;
                content = await this.source.getContent(progress);
            }

            const filename = await this.finish(uploaded);

            // final ID has two parts join with slash character
            const id = await this.shareUploadedFile(filename);
            return { id, key: await this.source.exportKey() };
        } catch (e) {
            if (e instanceof Error) {
                throw e;
            }

            throw new Error("An error occurred during uploading of file");
        }
    }

    /**
     * It sends request to dropbox for opening the uploading session and it
     * returns unique session_id
     *
     * @return session_id of current uploading session
     */
    private async createSessionId(): Promise<string> {
        const dbx = this.auth.getDropboxObject();

        const result = await dbx.filesUploadSessionStart({
            close: false,
            contents: new Uint8Array(0)
        });

        return result.session_id;
    }

    /**
     * It posts chunk of data to dropbox
     *
     * @param offset - the amount of data that has been uploaded so far
     * @param content - data
     * @param close - implicitly false, but if close parameter is true
     *                uploading session will be closed without saving
     */
    private async upload(
        offset: number,
        content: Uint8Array,
        close: boolean = false
    ): Promise<void> {
        const sessionId = await this.sessionPromise;

        const dbx = this.auth.getDropboxObject();
        await dbx.filesUploadSessionAppendV2({
            close,
            contents: content,
            cursor: {
                contents: Object,
                offset,
                session_id: sessionId
            }
        });
    }

    /**
     * It finishes the uploading session and generate unique name, which is
     * returned
     * @param offset - the amount of data that has been uploaded so far
     * @return Filename of file
     */
    private async finish(offset: number): Promise<string> {
        const sessionId = await this.sessionPromise;

        const dbx = this.auth.getDropboxObject();
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
                offset,
                session_id: sessionId
            }
        });

        return metadata.name;
    }

    /**
     * It makes file specified by filename PUBLIC and return ID
     * @param filename
     * @return ID of file
     */
    private async shareUploadedFile(filename: string): Promise<string> {
        const dbx = this.auth.getDropboxObject();
        const result = await dbx.sharingCreateSharedLinkWithSettings({
            path: `/${filename}`,
            settings: {
                access: { ".tag": "viewer" },
                requested_visibility: { ".tag": "public" }
            }
        });

        // parse URL and take only ID part
        return result.url.slice(26).split("?")[0];
    }
}
