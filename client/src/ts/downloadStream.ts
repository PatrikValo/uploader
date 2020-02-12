import { IReadStreamReturnValue, ReadStream } from "./readStream";
import Utils from "./utils";

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

    private async downloadChunk(
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
