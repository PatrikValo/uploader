import AuthDropbox from "./authDropbox";
import Config from "./config";
import {
    IDownloadStream,
    IDownloadStreamReturnValue
} from "./interfaces/IDownloadStream";
import Utils from "./utils";

abstract class DownloadStream implements IDownloadStream {
    private chunkNumber: number = 0;

    public read(): Promise<IDownloadStreamReturnValue> {
        return new Promise(async (resolve, reject) => {
            try {
                const chunk = await this.downloadChunk(this.chunkNumber);
                this.chunkNumber++;

                if (!chunk) {
                    return resolve({ done: true, value: new Uint8Array(0) });
                }
                return resolve({ done: false, value: chunk });
            } catch (e) {
                return reject(e);
            }
        });
    }

    protected abstract downloadChunk(
        numberOfChunk: number
    ): Promise<Uint8Array | null>;
}

export class DownloadStreamServer extends DownloadStream {
    private readonly url: string;
    private readonly startFrom: number;

    public constructor(id: string, startFrom: number) {
        super();
        this.url = Utils.serverClassicUrl("/api/download/" + id);
        this.startFrom = startFrom;
    }

    protected async downloadChunk(
        numberOfChunk: number
    ): Promise<Uint8Array | null> {
        const headers = [
            { header: "X-Chunk-Number", value: numberOfChunk.toString() },
            { header: "X-Start-From", value: this.startFrom.toString() }
        ];

        const result = await Utils.getRequest(this.url, headers, "arraybuffer");

        if (!result) {
            throw new Error("Empty response");
        }

        const chunk = new Uint8Array(result);
        return !chunk.length ? null : chunk;
    }
}

export class DownloadStreamDropbox extends DownloadStream {
    private readonly id: string;
    private readonly startFrom: number;
    private readonly auth: AuthDropbox;
    private readonly sizeEncryptedFile: Promise<number>;

    public constructor(id: string, startFrom: number, auth: AuthDropbox) {
        super();
        this.id = id;
        this.startFrom = startFrom;
        this.auth = auth;
        this.sizeEncryptedFile = this.getSizeOfEncryptedFile();
    }

    protected async downloadChunk(
        numberOfChunk: number
    ): Promise<Uint8Array | null> {
        const url = "https://content.dropboxapi.com/2/files/download";
        const size = await this.sizeEncryptedFile;

        const start = this.startFrom + numberOfChunk * Config.client.chunkSize;
        if (start > size) {
            return null;
        }

        let end = start + Config.client.chunkSize;
        if (end > size) {
            end = size;
        }

        const headers = [
            {
                header: "Authorization",
                value: `Bearer ${this.auth.getAccessToken()}`
            },
            {
                header: "Dropbox-API-Arg",
                value: JSON.stringify({ path: `/${this.id}` })
            },
            {
                header: "Range",
                value: `bytes=${start}-${end - 1}`
            }
        ];

        const result = await Utils.getRequest(url, headers, "arraybuffer");

        if (!result || result.byteLength !== end - start) {
            throw new Error("Invalid response");
        }

        return new Uint8Array(result);
    }

    private getSizeOfEncryptedFile(): Promise<number> {
        const url = "https://api.dropboxapi.com/2/files/get_metadata";
        const headers = [
            {
                header: "Authorization",
                value: `Bearer ${this.auth.getAccessToken()}`
            },
            {
                header: "Content-Type",
                value: "application/json"
            }
        ];

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    return reject(new Error(String(xhr.status)));
                }

                if (xhr.response && xhr.response.size) {
                    return resolve(xhr.response.size);
                }

                return reject(new Error("Response is not valid"));
            };

            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.open("post", url, true);

            headers.forEach(value => {
                xhr.setRequestHeader(value.header, value.value);
            });

            xhr.responseType = "json";
            xhr.send(JSON.stringify({ path: "/" + this.id }));
        });
    }
}
