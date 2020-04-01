import { Encryption } from "../../../client/src/ts/cipher";
import Config from "../../../client/src/ts/config";
import Metadata from "../../../client/src/ts/metadata";

abstract class AClass {
    public abstract getFile(): File;

    public additionalData(password: boolean): Uint8Array {
        const flag = password ? 1 : 0;
        const { ivLength, saltLength } = Config.cipher;
        const u = new Uint8Array(ivLength + 1 + saltLength);
        u[ivLength] = flag;
        return u;
    }

    public metadata(): Uint8Array {
        return new Metadata(this.getFile()).toUint8Array();
    }

    public async encryptedMetadata(password?: string): Promise<Uint8Array> {
        const m = this.metadata();
        const e = new Encryption(password);
        const first = await e.encrypt(m);
        const second = await e.final();
        const r = new Uint8Array(first.length + second.length);
        r.set(first);
        r.set(second, first.length);
        return r;
    }

    public async encryptedMetadataWithLength(
        password?: string
    ): Promise<Uint8Array> {
        const m = await this.encryptedMetadata(password);

        const len = Metadata.lengthToUint8Array(m.length);
        const ret = new Uint8Array(len.length + m.length);
        ret.set(len);
        ret.set(m, len.length);

        return ret;
    }
}

export class FileSmallerThanChunk extends AClass {
    private readonly file: File;
    private readonly data: Uint8Array;

    public constructor() {
        super();
        const data = [125];
        for (let i = 0; i < Config.client.chunkSize - 12; i++) {
            data.push(8);
        }
        data.push(125);

        this.data = new Uint8Array(data);
        const blob = new Blob([], { type: "application/javascript" });
        this.file = new File([blob, this.data], "fileSmallerThanChunk.js");
    }

    public getFile(): File {
        return this.file;
    }

    public async encryptFile(password?: string): Promise<Uint8Array[]> {
        const iv = (await this.encryptedMetadataWithLength(password)).slice(
            -Config.cipher.ivLength
        );
        const e = new Encryption(password);
        e.reset(iv);
        const first = await e.encrypt(this.data);
        const second = await e.final();
        return [first, second];
    }

    public exportKey(password?: string): Promise<string> {
        const e = new Encryption(password);
        return e.getExportedKey();
    }

    public async completeAdditionalData(password: boolean) {
        const { ivLength, saltLength } = Config.cipher;
        const flag = new Uint8Array([password ? 1 : 0]);
        const salt = new Uint8Array(saltLength);
        const iv = new Uint8Array(ivLength);
        const len = Metadata.lengthToNumber(
            (await this.encryptedMetadataWithLength()).slice(0, 2)
        );
        return { iv, flag, salt, len };
    }
}

export class FileChunk extends AClass {
    private readonly file: File;
    private readonly data: Uint8Array;
    public constructor() {
        super();
        const data = [125];
        for (let i = 0; i < Config.client.chunkSize - 2; i++) {
            data.push(8);
        }
        data.push(125);

        this.data = new Uint8Array(data);
        const blob = new Blob([], { type: "application/javascript" });
        this.file = new File([blob, this.data], "fileChunk.js");
    }

    public getFile(): File {
        return this.file;
    }
}

export class FileBiggerThanChunk extends AClass {
    private readonly file: File;
    private readonly data: Uint8Array;
    public constructor() {
        super();
        const data = [125];
        for (let i = 0; i < 2 * Config.client.chunkSize - 2; i++) {
            data.push(8);
        }
        data.push(125);

        this.data = new Uint8Array(data);
        const blob = new Blob([], { type: "application/javascript" });
        this.file = new File([blob, this.data], "fileBiggerThanChunk.js");
    }

    public getFile(): File {
        return this.file;
    }
}
