import AbstractDownloadStream from "./abstract/abstractDownloadStream";
import Config from "./config";
import Utils from "./utils";

export default class DownloadStream extends AbstractDownloadStream {
    private readonly url: string;
    private readonly startFrom: number;
    private readonly sizeEncryptedFile: number;

    public constructor(
        id: string,
        startFrom: number,
        sizeEncryptedFile: number,
        dropbox?: { sharing: string }
    ) {
        super();
        if (dropbox) {
            this.url = `https://dl.dropboxusercontent.com/s/${dropbox.sharing}/${id}?dl=1`;
        } else {
            this.url = Utils.serverClassicUrl("/api/download/" + id);
        }
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
