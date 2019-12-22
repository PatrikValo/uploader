import Config from "./config";
import Metadata from "./metadata";
import Utils from "./utils";

export abstract class Cipher {
    protected crypto: Crypto = window.crypto;
    protected abstract keyPromise: Promise<CryptoKey>;
    protected abstract iv: Uint8Array;
    protected abstract salt: Uint8Array;

    public randomValues(size: number): Uint8Array {
        const buff = new Uint8Array(size);
        return this.crypto.getRandomValues(buff);
    }

    public serverRandomValues(size: number): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status !== 200) {
                    return reject(new Error(String(xhr.status)));
                }

                if (xhr.response) {
                    return resolve(xhr.response as Uint8Array);
                }

                return reject(new Error("Response is empty"));
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            const url = Utils.server.classicUrl("/api/random/" + size);
            xhr.open("get", url);
            xhr.responseType = "arraybuffer";
            xhr.send();
        });
    }

    public initializationVector(): Uint8Array {
        return this.iv;
    }

    public getSalt(): Uint8Array {
        return this.salt;
    }

    public async exportedKey(): Promise<string> {
        const key: CryptoKey = await this.keyPromise;
        const buffer = await this.crypto.subtle.exportKey("raw", key);
        return Utils.Uint8ArrayToBase64(new Uint8Array(buffer));
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
        const encrypted: ArrayBuffer = await this.crypto.subtle.encrypt(
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
        const decrypted: ArrayBuffer = await this.crypto.subtle.decrypt(
            {
                iv: this.iv,
                name: "AES-GCM"
            },
            key,
            chunk
        );
        return new Uint8Array(decrypted);
    }
}

export class ClassicCipher extends Cipher {
    protected readonly keyPromise: Promise<CryptoKey>;
    protected readonly iv: Uint8Array;
    protected readonly salt: Uint8Array;

    public constructor(key?: CryptoKey | string, iv?: Uint8Array) {
        super();
        this.keyPromise = this.initKeyPromise(key);
        this.iv = iv || this.randomValues(Config.cipher.ivLength);
        this.salt = new Uint8Array(Config.cipher.saltLength);
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

    private async importKey(key: string): Promise<CryptoKey> {
        const uint = Utils.base64toUint8Array(key);
        return await this.crypto.subtle.importKey(
            "raw",
            uint,
            "AES-GCM",
            true,
            ["encrypt", "decrypt"]
        );
    }

    private async generateKey(): Promise<CryptoKey> {
        return await this.crypto.subtle.generateKey(
            {
                length: Config.cipher.keyLength,
                name: "AES-GCM"
            },
            true,
            ["encrypt", "decrypt"]
        );
    }
}

export class PasswordCipher extends Cipher {
    protected readonly keyPromise: Promise<CryptoKey>;
    protected readonly iv: Uint8Array;
    protected readonly salt: Uint8Array;

    public constructor(password: string, salt?: Uint8Array, iv?: Uint8Array) {
        super();
        this.keyPromise = this.deriveKey(password);
        this.iv = iv || this.randomValues(Config.cipher.ivLength);
        this.salt = salt || this.randomValues(Config.cipher.saltLength);
    }

    private async deriveKey(pw: string): Promise<CryptoKey> {
        const buff = Utils.stringToUint8Array(pw);

        const keyMaterial = await this.crypto.subtle.importKey(
            "raw",
            buff,
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return await this.crypto.subtle.deriveKey(
            {
                hash: "SHA-256",
                iterations: Config.cipher.deriveIterations,
                name: "PBKDF2",
                salt: this.salt
            },
            keyMaterial,
            { name: "AES-GCM", length: Config.cipher.keyLength },
            true,
            ["encrypt", "decrypt"]
        );
    }
}
