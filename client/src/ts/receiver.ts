import IReceiver from "./interfaces/iReceiver";
import Utils from "./utils";

/**
 * It sends GET request on server, which is specified by url param.
 * It returns data, whose first position is specified by start param and
 * last position is specified by end param
 * @param url - destination of request
 * @param start - first position
 * @param end - last position
 * @return Promise with data
 */
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

export class ReceiverServer implements IReceiver {
    private readonly url: string;

    public constructor(id: string) {
        this.url = Utils.serverClassicUrl("/api/range/" + id);
    }

    public async receive(from: number, to: number): Promise<Uint8Array> {
        return rangeRequest(this.url, from, to);
    }
}

export class ReceiverDropbox implements IReceiver {
    private readonly url: string;

    public constructor(id: string) {
        this.url = `https://www.dl.dropboxusercontent.com/s/${id}?dl=1`;
    }

    public async receive(from: number, to: number): Promise<Uint8Array> {
        return rangeRequest(this.url, from, to);
    }
}
