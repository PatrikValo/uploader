import { Decryption } from "./cipher";
import Config from "./config";
import { DownloadMetadataSource } from "./downloadSource";
import Metadata from "./metadata";

interface IPlainData {
    iv: Uint8Array;
    flag: Uint8Array;
    salt: Uint8Array;
    len: number;
}

interface IReturnValue {
    metadata: Metadata;
    decryptionForFile: { key: Uint8Array; iv: Uint8Array };
}

export default class DownloadMetadata {
    private readonly source: DownloadMetadataSource;
    private readonly plainData: Promise<IPlainData>;
    private readonly metadata: Promise<Uint8Array>;

    public constructor(id: string, sharing: string) {
        if (sharing) {
            this.source = new DownloadMetadataSource(
                `${sharing}/${id}`,
                "dropbox"
            );
        } else {
            this.source = new DownloadMetadataSource(id, "server");
        }
        this.plainData = this.source.downloadPlainData();
        this.metadata = this.downloadMetadata();
    }

    public async passwordIsRequired(): Promise<boolean> {
        const data = await this.plainData;
        return data.flag[0] === 1;
    }

    public async validate(
        keyMaterial: Uint8Array | string,
        password?: string
    ): Promise<IReturnValue | null> {
        const data = await this.plainData;
        const encrypted = await this.metadata;

        const required = await this.passwordIsRequired();
        if ((password && !required) || (!password && required)) {
            throw new Error(
                `Password param is${required ? "" : "n't"} required`
            );
        }

        const decryptor = password
            ? new Decryption(keyMaterial, data.iv, password, data.salt)
            : new Decryption(keyMaterial, data.iv);

        try {
            const m = await decryptor.final(encrypted);
            const metadata = new Metadata(m);

            const iv = encrypted.slice(-Config.cipher.ivLength);
            const key = await decryptor.getKey();
            return {
                decryptionForFile: { iv, key },
                metadata
            };
        } catch (e) {
            // Key is not correct
            return null;
        }
    }

    private async downloadMetadata(): Promise<Uint8Array> {
        const data = await this.plainData;
        return this.source.downloadMetadata(data.len);
    }
}
