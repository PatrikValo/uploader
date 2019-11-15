export default class DownloadStream implements UnderlyingSource {
    public pull: ReadableStreamDefaultControllerCallback<any> = this.read;

    private readonly url: string;
    private chunkNumber: number;

    public constructor(url: string) {
        this.url = url;
        this.chunkNumber = 0;
    }

    private read(
        controller: ReadableStreamDefaultController<any>
    ): PromiseLike<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const chunk = await this.downloadChunk(this.chunkNumber);
                this.chunkNumber++;

                if (!chunk) {
                    return resolve(controller.close());
                }
                return resolve(controller.enqueue(chunk));
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
