import AbstractDownloadMetadata from "./abstract/abstractDownloadMetadata";
import Utils from "./utils";

export default class DownloadMetadata extends AbstractDownloadMetadata {
    private readonly url: string;

    public constructor(id: string, dropbox?: { sharing: string }) {
        super();
        if (dropbox) {
            this.url = `https://www.dl.dropboxusercontent.com/s/${dropbox.sharing}/${id}?dl=1`;
            return;
        }
        this.url = Utils.serverClassicUrl("/api/download/" + id);
    }

    protected async range(start: number, end: number): Promise<Uint8Array> {
        const headers = [
            {
                header: "Range",
                value: `bytes=${start}-${end - 1}`
            }
        ];
        const result = await Utils.getRequest(this.url, headers, "arraybuffer");

        if (
            !result ||
            result.byteLength === 0 ||
            result.byteLength !== end - start
        ) {
            throw new Error("Invalid response");
        }

        return new Uint8Array(result);
    }
}
