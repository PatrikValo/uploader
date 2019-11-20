import Metadata from "./metadata";
import Password from "./password";
import Utils from "./utils";

export default class Cipher {
    public static async importKey(key: string): Promise<CryptoKey> {
        const uint = Utils.base64toUint8Array(key);
        return await Cipher.crypto.importKey("raw", uint, "AES-GCM", true, [
            "encrypt",
            "decrypt"
        ]);
    }

    public static async exportKey(key: CryptoKey): Promise<string> {
        const buffer = await Cipher.crypto.exportKey("raw", key);
        return Utils.Uint8ArrayToBase64(new Uint8Array(buffer));
    }

    public static async generateKey(): Promise<CryptoKey> {
        return await Cipher.crypto.generateKey(
            {
                length: 128,
                name: "AES-GCM"
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    public static async importPassword(
        pw: string,
        salt: Uint8Array
    ): Promise<CryptoKey> {
        const uint = Utils.stringToUint8Array(pw);
        const keyMaterial = await Cipher.crypto.importKey(
            "raw",
            uint,
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return await Cipher.crypto.deriveKey(
            {
                hash: "SHA-256",
                iterations: 10000,
                name: "PBKDF2",
                salt
            },
            keyMaterial,
            { name: "AES-GCM", length: 128 },
            true,
            ["encrypt", "decrypt"]
        );
    }

    private static readonly crypto: SubtleCrypto = window.crypto.subtle;

    private readonly keyPromise: Promise<CryptoKey>;
    private readonly iv: Uint8Array;

    public constructor(key?: CryptoKey | string | Password, iv?: Uint8Array) {
        this.keyPromise = this.initKeyPromise(key);
        this.iv = iv || window.crypto.getRandomValues(new Uint8Array(16));
    }

    public initializationVector(): Uint8Array {
        return this.iv;
    }

    public async exportedKey(): Promise<string> {
        const key: CryptoKey = await this.keyPromise;
        return Cipher.exportKey(key);
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
        const encrypted: ArrayBuffer = await Cipher.crypto.encrypt(
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
        const decrypted: ArrayBuffer = await Cipher.crypto.decrypt(
            {
                iv: this.iv,
                name: "AES-GCM"
            },
            key,
            chunk
        );
        return new Uint8Array(decrypted);
    }

    private async initKeyPromise(
        key?: CryptoKey | string | Password
    ): Promise<CryptoKey> {
        if (!key) {
            return await Cipher.generateKey();
        }

        if (key instanceof CryptoKey) {
            return new Promise(resolve => {
                resolve(key);
            });
        }

        if (key instanceof Password) {
            return Cipher.importPassword(key.pw, key.salt);
        }

        return await Cipher.importKey(key);
    }
}
