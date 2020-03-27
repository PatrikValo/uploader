import AbstractDownloadMetadata from "./abstract/abstractDownloadMetadata";
import Utils from "./utils";

async function rangeRequest(
    url: string,
    start: number,
    end: number
): Promise<Uint8Array> {
    const headers = [
        {
            header: "Range",
            value: `bytes=${start}-${end - 1}`
        }
    ];
    const result = await Utils.getRequest(url, headers, "arraybuffer");

    if (
        !result ||
        result.byteLength === 0 ||
        result.byteLength !== end - start
    ) {
        throw new Error("Invalid response");
    }

    return new Uint8Array(result);
}

export class DownloadMetadataServer extends AbstractDownloadMetadata {
    private readonly url: string;

    public constructor(id: string) {
        super();
        this.url = Utils.serverClassicUrl("/api/range/" + id);
    }

    protected async range(start: number, end: number): Promise<Uint8Array> {
        return rangeRequest(this.url, start, end);
    }
}

export class DownloadMetadataDropbox extends AbstractDownloadMetadata {
    private readonly url: string;

    public constructor(id: string, sharing: string) {
        super();
        this.url = `https://www.dl.dropboxusercontent.com/s/${sharing}/${id}?dl=1`;
    }

    protected async range(start: number, end: number): Promise<Uint8Array> {
        return rangeRequest(this.url, start, end);
    }
}
