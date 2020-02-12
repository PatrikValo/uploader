import Config from "./config";
import Metadata from "./metadata";
import Utils from "./utils";

export abstract class Cipher {
    protected readonly crypto: Crypto = window.crypto;
    protected abstract readonly keyPromise: Promise<CryptoKey>;
    protected abstract readonly iv: Uint8Array;

    public abstract getSalt(): Promise<Uint8Array>;

    public clientRandomValues(size: number): Uint8Array {
        const buff = new Uint8Array(size);
        return this.crypto.getRandomValues(buff);
    }

    public async serverRandomValues(size: number): Promise<Uint8Array> {
        const url = Utils.server.classicUrl("/api/random/" + size);
        const result = await Utils.getRequest(url, [], "arraybuffer");

        if (!result || result.byteLength !== size) {
            throw new Error("Incorrect response");
        }

        return new Uint8Array(result);
    }

    public randomValues(size: number): Promise<Uint8Array> {
        return new Promise(async resolve => {
            const clientRandom = this.clientRandomValues(size);

            try {
                const serverRandom = await this.serverRandomValues(size);

                const concat = new Uint8Array(2 * size);
                concat.set(clientRandom);
                concat.set(serverRandom, size);

                const result = await this.digest(concat);
                return resolve(result);
            } catch (e) {
                return resolve(clientRandom);
            }
        });
    }

    public initializationVector(): Uint8Array {
        return this.iv;
    }

    public async digest(array: Uint8Array): Promise<Uint8Array> {
        const short: ArrayBuffer = await this.crypto.subtle.digest(
            "SHA-256",
            array
        );
        return new Uint8Array(short);
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

    public constructor(key?: CryptoKey | string, iv?: Uint8Array) {
        super();
        this.keyPromise = this.initKeyPromise(key);
        this.iv = iv || this.clientRandomValues(Config.cipher.ivLength);
    }

    public getSalt(): Promise<Uint8Array> {
        return new Promise(resolve => {
            return resolve(new Uint8Array(Config.cipher.saltLength));
        });
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
        const random = await this.randomValues(Config.cipher.saltLength);

        return await this.crypto.subtle.importKey(
            "raw",
            random,
            "AES-GCM",
            true,
            ["encrypt", "decrypt"]
        );
    }
}

export class PasswordCipher extends Cipher {
    protected readonly keyPromise: Promise<CryptoKey>;
    protected readonly iv: Uint8Array;
    protected readonly salt: Promise<Uint8Array>;

    public constructor(password: string, salt?: Uint8Array, iv?: Uint8Array) {
        super();
        this.keyPromise = this.deriveKey(password);
        this.iv = iv || this.clientRandomValues(Config.cipher.ivLength);
        this.salt = new Promise(resolve => {
            return resolve(salt || this.randomValues(Config.cipher.saltLength));
        });
    }

    public getSalt(): Promise<Uint8Array> {
        return this.salt;
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

        const salt = await this.salt;

        return await this.crypto.subtle.deriveKey(
            {
                hash: "SHA-256",
                iterations: Config.cipher.deriveIterations,
                name: "PBKDF2",
                salt
            },
            keyMaterial,
            { name: "AES-GCM", length: Config.cipher.keyLength },
            true,
            ["encrypt", "decrypt"]
        );
    }
}
