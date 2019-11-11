import Metadata from "./metadata";

export default class Ciphering {
    private readonly crypto: SubtleCrypto;
    private readonly keyPromise: Promise<CryptoKey>;
    private readonly iv: Uint8Array;

    public constructor(
        key?: CryptoKey | string,
        iv?: Uint8Array,
        password?: string
    ) {
        this.crypto = window.crypto.subtle;
        this.keyPromise = this.initKeyPromise(key);
        this.iv = iv || window.crypto.getRandomValues(new Uint8Array(16));
    }

    public initializationVector(): Uint8Array {
        return this.iv;
    }

    public async exportedKey(): Promise<string> {
        const key: CryptoKey = await this.keyPromise;
        return this.exportKey(key);
    }

    public async encryptMetadata(metadata: Metadata): Promise<Uint8Array> {
        const metadataArray: Uint8Array = metadata.toUint8Array();
        return await this.encryptChunk(metadataArray);
    }

    public async decryptMetadata(metadata: Uint8Array): Promise<Metadata> {
        const decryptMetadata = await this.decryptChunk(metadata);
        return new Metadata(decryptMetadata);
    }

    public async encryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
        const key: CryptoKey = await this.keyPromise;
        const encrypted: ArrayBuffer = await this.crypto.encrypt(
            {
                iv: this.iv,
                name: "AES-GCM"
            },
            key,
            chunk
        );
        return new Uint8Array(encrypted);
    }

    public async decryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
        const key: CryptoKey = await this.keyPromise;
        const decrypted: ArrayBuffer = await this.crypto.decrypt(
            {
                iv: this.iv,
                name: "AES-GCM"
            },
            key,
            chunk
        );

        return new Uint8Array(decrypted);
    }

    private async initKeyPromise(key?: CryptoKey | string): Promise<CryptoKey> {
        if (!key) {
            return await this.generateKey();
        }

        if (key instanceof CryptoKey) {
            return new Promise(resolve => {
                resolve(key);
            });
        }

        return await this.importKey(key);
    }

    private generateKey(length: number = 128): PromiseLike<CryptoKey> {
        return this.crypto.generateKey(
            {
                length,
                name: "AES-GCM"
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    private importKey(key: string): PromiseLike<CryptoKey> {
        const uint = new Uint8Array(
            atob(key)
                .split("")
                .map((c: string) => {
                    return c.charCodeAt(0);
                })
        );
        return this.crypto.importKey("raw", uint, "AES-GCM", true, [
            "encrypt",
            "decrypt"
        ]);
    }

    private async exportKey(key: CryptoKey): Promise<string> {
        const buffer = await this.crypto.exportKey("raw", key);
        const array = Array.from(new Uint8Array(buffer));
        return btoa(String.fromCharCode.apply(null, array));
    }

    /*public static support(): boolean {
        const crypto: Crypto = window.crypto;

        if (!crypto) {
            return false;
        }

        if (!crypto.subtle) {
            return false;
        }

        if (!crypto.getRandomValues) {
            return false;
        }

        return true;
    }*/
}
