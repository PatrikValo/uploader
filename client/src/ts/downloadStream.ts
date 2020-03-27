import AbstractDownloadStream from "./abstract/abstractDownloadStream";
import Config from "./config";
import Utils from "./utils";

export class DownloadStreamServer extends AbstractDownloadStream {
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

export class DownloadStreamDropbox extends AbstractDownloadStream {
    private readonly url: string;
    private readonly startFrom: number;
    private readonly sizeEncryptedFile: number;

    public constructor(
        id: string,
        sharing: string,
        startFrom: number,
        sizeEncryptedFile: number
    ) {
        super();
        this.url = `https://dl.dropboxusercontent.com/s/${sharing}/${id}?dl=1`;
        this.startFrom = startFrom;
        this.sizeEncryptedFile = sizeEncryptedFile;
    }

    protected async downloadChunk(
        numberOfChunk: number
    ): Promise<Uint8Array | null> {
        const size = this.sizeEncryptedFile;

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
                header: "Range",
                value: `bytes=${start}-${end - 1}`
            }
        ];

        const result = await Utils.getRequest(this.url, headers, "arraybuffer");

        if (!result || result.byteLength !== end - start) {
            throw new Error("Invalid response");
        }

        return new Uint8Array(result);
    }
}
