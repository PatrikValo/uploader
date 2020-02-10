import Config from "./config";
import Utils from "./utils";

interface IReturnValue {
    iv: Uint8Array;
    metadata: Uint8Array;
    password: {
        flag: boolean;
        salt: Uint8Array | null;
    };
    startFrom: number;
}

function lengthOfMetadata(uint: Uint8Array): number {
    if (uint.length !== 2) {
        throw new Error("Incorrect size");
    }
    const fst = uint[0].toString(16);
    let snd = uint[1].toString(16);
    snd = snd.length === 1 ? "0" + snd : snd;

    return parseInt(fst + snd, 16);
}

export default class DownloadMetadata {
    private readonly id: string;

    public constructor(id: string) {
        this.id = id;
    }

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

    private range(start: number, end: number): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status !== 200) {
                    return reject(new Error(String(xhr.status)));
                }

                if (xhr.response) {
                    return resolve(new Uint8Array(xhr.response));
                }

                return reject(new Error("Response is empty"));
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            const url = Utils.server.classicUrl("/api/metadata/" + this.id);
            xhr.open("get", url, true);
            xhr.setRequestHeader("Range", `bytes=${start}-${end}`);
            xhr.responseType = "arraybuffer";
            xhr.send();
        });
    }

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
        return lengthOfMetadata(uint);
    }

    private getMetadata(length: number): Promise<Uint8Array> {
        const start = Config.cipher.ivLength + 1 + Config.cipher.saltLength + 2;
        const end = start + length;
        return this.range(start, end);
    }
}
