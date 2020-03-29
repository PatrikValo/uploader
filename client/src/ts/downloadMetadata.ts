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
    }

    public async passwordIsRequired(): Promise<boolean> {
        const data = await this.plainData;
        return data.flag[0] === 1;
    }

    public download(key: Uint8Array): Promise<IReturnValue | null>;
    public download(password: string): Promise<IReturnValue | null>;
    public async download(
        keyMaterial: Uint8Array | string
    ): Promise<IReturnValue | null> {
        const data = await this.plainData;
        const encrypted = await this.source.downloadMetadata(data.len);

        let decryptor;
        if (typeof keyMaterial === "string") {
            if (!(await this.passwordIsRequired())) {
                throw new Error("Key is required, but password was given");
            }
            decryptor = new Decryption(keyMaterial, data.iv, data.salt);
        } else {
            if (await this.passwordIsRequired()) {
                throw new Error("Password is required, but key was given");
            }
            decryptor = new Decryption(keyMaterial, data.iv);
        }

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
}
