import config from "./config";

export interface IReadStreamReturnValue {
    done: boolean;
    value: Uint8Array;
}

export abstract class ReadStream {
    public abstract read(): Promise<IReadStreamReturnValue>;

    protected close(): IReadStreamReturnValue {
        return { done: true, value: new Uint8Array(0) };
    }

    protected enqueue(value: Uint8Array): IReadStreamReturnValue {
        return { done: false, value };
    }
}

class DownloadStream extends ReadStream {
    private readonly url: string;
    private chunkNumber: number;

    public constructor(url: string) {
        super();
        this.url = url;
        this.chunkNumber = 0;
    }

    public read(): Promise<IReadStreamReturnValue> {
        return new Promise(async (resolve, reject) => {
            const chunk = await this.downloadChunk(this.chunkNumber);
            this.chunkNumber++;

            if (!chunk) {
                return resolve(super.close());
            }
            return resolve(super.enqueue(chunk));
        });
    }

    private downloadChunk(numberOfChunk: number): Promise<Uint8Array | null> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status !== 200) {
                    return reject();
                }

                if (xhr.response) {
                    const chunk = new Uint8Array(xhr.response);
                    if (!chunk.length) {
                        return resolve(null);
                    }
                    return resolve(chunk);
                }
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            // TODO replace by custom header X-Chunk-...
            xhr.open("get", this.url + "/" + this.chunkNumber);
            xhr.responseType = "arraybuffer";
            xhr.send();
        });
    }
}
