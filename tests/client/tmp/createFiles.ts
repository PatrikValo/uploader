import { Encryption } from "../../../client/src/ts/cipher";
import Config from "../../../client/src/ts/config";
import Metadata from "../../../client/src/ts/metadata";
import Utils from "../../../client/src/ts/utils";

abstract class AClass {
    public abstract getFile(): File;

    public additionalData(password: boolean): Uint8Array {
        const flag = password ? 1 : 0;
        const { ivLength } = Config.cipher;
        const u = new Uint8Array(ivLength + 1);
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

        return Utils.concatUint8Arrays(first, second);
    }

    public async encryptedMetadataWithLength(
        password?: string
    ): Promise<Uint8Array> {
        const m = await this.encryptedMetadata(password);

        const len = Metadata.lengthToUint8Array(m.length);

        return Utils.concatUint8Arrays(len, m);
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
        return e.getExportedFragment();
    }

    public async completeAdditionalData(password: boolean) {
        const { ivLength, saltLength } = Config.cipher;
        const flag = new Uint8Array([password ? 1 : 0]);
        const iv = new Uint8Array(ivLength);
        const len = Metadata.lengthToNumber(
            (await this.encryptedMetadataWithLength()).slice(0, 2)
        );
        return { iv, flag, len };
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
