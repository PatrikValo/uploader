import { IReadStreamReturnValue, ReadStream } from "./readStream";

export default class DownloadStream extends ReadStream {
    private readonly url: string;
    private chunkNumber: number;
    private startFrom: number;

    public constructor(url: string, startFrom: number) {
        super();
        this.url = url;
        this.chunkNumber = 0;
        this.startFrom = startFrom;
    }

    public read(): Promise<IReadStreamReturnValue> {
        return new Promise(async (resolve, reject) => {
            try {
                const chunk = await this.downloadChunk(this.chunkNumber);
                this.chunkNumber++;

                if (!chunk) {
                    return resolve(super.close());
                }
                return resolve(super.enqueue(chunk));
            } catch (e) {
                return reject(e);
            }
        });
    }

    private downloadChunk(numberOfChunk: number): Promise<Uint8Array | null> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status !== 200) {
                    return reject(new Error(String(xhr.status)));
                }

                if (xhr.response) {
                    const chunk = new Uint8Array(xhr.response);
                    if (!chunk.length) {
                        return resolve(null);
                    }
                    return resolve(chunk);
                }

                reject(new Error("Empty response"));
            };

            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.open("get", this.url);
            xhr.setRequestHeader("X-Chunk-Number", numberOfChunk.toString());
            xhr.setRequestHeader("X-Start-From", this.startFrom.toString());
            xhr.responseType = "arraybuffer";
            xhr.send();
        });
    }
}
