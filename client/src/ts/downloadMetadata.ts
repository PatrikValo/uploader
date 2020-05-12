import { Decryption } from "./cipher";
import Config from "./config";
import DownloadMetadataSource from "./downloadMetadataSource";
import { StorageType } from "./interfaces/storageType";
import Metadata from "./metadata";

interface IAdditionalData {
    iv: Uint8Array;
    flag: Uint8Array;
    len: number;
}

interface IReturnValue {
    metadata: Metadata;
    decryptionForFile: { key: Uint8Array; iv: Uint8Array };
}

export default class DownloadMetadata {
    private readonly source: DownloadMetadataSource;
    private readonly additionalDataPromise: Promise<IAdditionalData>;
    private readonly metadataPromise: Promise<Uint8Array>;

    public constructor(id: string, receiver: StorageType) {
        this.source = new DownloadMetadataSource(id, receiver);
        this.additionalDataPromise = this.source.downloadAdditionalData();
        this.metadataPromise = this.downloadMetadata();
    }

    /**
     * It checks if the password was used during encryption.
     *
     * @return Promise with boolean - true - password is required
     *                                false - password isn't required
     */
    public async passwordIsRequired(): Promise<boolean> {
        const data = await this.additionalDataPromise;
        return data.flag[0] === 1;
    }

    /**
     * It tries to decrypt the metadata of file. If decryption goes well
     * and authTag is valid, it returns decrypted metadata and
     * initialization vector + key that was used.
     *
     * @param fragment - base64 key or raw key
     * @param password
     * @return Promise with null - if authTag of metadata is not valid
     *                      metadata + iv + key - if authTag of metadata is valid
     */
    public async validate(
        fragment: string,
        password?: string
    ): Promise<IReturnValue | null> {
        const data = await this.additionalDataPromise;
        const encrypted = await this.metadataPromise;

        // check if password has correct type
        const r = await this.passwordIsRequired();
        if ((password !== undefined && !r) || (password === undefined && r)) {
            throw new Error(`Password param is${r ? "" : "n't"} required`);
        }

        const decryptor = password
            ? new Decryption(fragment, data.iv, password)
            : new Decryption(fragment, data.iv);

        try {
            const m = await decryptor.final(encrypted);
            const metadata = new Metadata(m);

            const iv = encrypted.slice(-Config.cipher.ivLength);
            const key = await decryptor.getDecryptionKey();
            return {
                decryptionForFile: { iv, key },
                metadata
            };
        } catch (e) {
            // Key is not correct
            return null;
        }
    }

    /**
     * It downloads the metadata of file.
     *
     * @return Promise with raw metadata
     */
    private async downloadMetadata(): Promise<Uint8Array> {
        const data = await this.additionalDataPromise;
        return this.source.downloadMetadata(data.len);
    }
}
