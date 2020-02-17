import AuthDropbox from "./authDropbox";
import Config from "./config";
import {
    IDownloadMetadata,
    IReturnValue
} from "./interfaces/IDownloadMetadata";
import Metadata from "./metadata";
import Utils from "./utils";

abstract class DownloadMetadata implements IDownloadMetadata {
    public async download(): Promise<IReturnValue> {
        const iv: Uint8Array = await this.getIv();
        const flag: Uint8Array = await this.getFlag();
        const len: number = await this.getLength();
        const metadata: Uint8Array = await this.getMetadata(len);
        const c = Config.cipher;
        const startFrom = c.ivLength + 1 + c.saltLength + 2 + len;
        if (flag[0] === 0) {
            return {
                iv,
                metadata,
                password: { flag: false, salt: null },
                startFrom
            };
        }
        const salt = await this.getSalt();
        return {
            iv,
            metadata,
            password: { flag: true, salt },
            startFrom
        };
    }

    protected abstract range(start: number, end: number): Promise<Uint8Array>;

    private getIv(): Promise<Uint8Array> {
        return this.range(0, Config.cipher.saltLength);
    }

    private getFlag(): Promise<Uint8Array> {
        const start = Config.cipher.saltLength;
        const end = start + 1;
        return this.range(start, end);
    }

    private getSalt(): Promise<Uint8Array> {
        const start = Config.cipher.ivLength + 1;
        const end = start + Config.cipher.saltLength;
        return this.range(start, end);
    }

    private async getLength(): Promise<number> {
        const start = Config.cipher.ivLength + 1 + Config.cipher.saltLength;
        const end = start + 2;
        const uint = await this.range(start, end);
        return Metadata.lengthToNumber(uint);
    }

    private getMetadata(length: number): Promise<Uint8Array> {
        const start = Config.cipher.ivLength + 1 + Config.cipher.saltLength + 2;
        const end = start + length;
        return this.range(start, end);
    }
}

export class DownloadMetadataServer extends DownloadMetadata {
    private readonly id: string;

    public constructor(id: string) {
        super();
        this.id = id;
    }

    protected async range(start: number, end: number): Promise<Uint8Array> {
        const url = Utils.serverClassicUrl("/api/metadata/" + this.id);
        const headers = [
            {
                header: "Range",
                value: `bytes=${start}-${end}`
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
}

export class DownloadMetadataDropbox extends DownloadMetadata {
    private readonly id: string;
    private readonly auth: AuthDropbox;

    public constructor(id: string, auth: AuthDropbox) {
        super();
        this.id = id;
        this.auth = auth;
    }

    protected async range(start: number, end: number): Promise<Uint8Array> {
        const url = "https://content.dropboxapi.com/2/files/download";
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
