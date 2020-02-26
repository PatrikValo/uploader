import Config from "./config";
import Metadata from "./metadata";
import Utils from "./utils";

export abstract class Cipher {
    protected readonly crypto: Crypto = window.crypto;
    protected abstract readonly keyPromise: Promise<CryptoKey>;
    protected abstract readonly iv: Uint8Array;

    /**
     * It returns salt, which was used for deriving key from password. If password
     * wasn't used, it returns result, which contains only zeros. Length of salt
     * is defined in Config.cipher.saltLength
     *
     * @return Promise with salt
     */
    public abstract getSalt(): Promise<Uint8Array>;

    /**
     * It generates random values on client side.
     *
     * @param size
     * @return random values
     */
    public clientRandomValues(size: number): Uint8Array {
        const buff = new Uint8Array(size);
        return this.crypto.getRandomValues(buff);
    }

    /**
     * It downloads random values generated on server side.
     *
     * @param size
     * @return Promise with random values
     */
    public async serverRandomValues(size: number): Promise<Uint8Array> {
        const url = Utils.serverClassicUrl("/api/random/" + size);
        const result = await Utils.getRequest(url, [], "arraybuffer");

        if (!result || result.byteLength !== size) {
            throw new Error("Incorrect response");
        }

        return new Uint8Array(result);
    }

    /**
     * It creates random values, which are combination of client and server
     * random values. Number of random values is limited by 32 values.
     * @param size
     * @throws Error object, if size param is greater than 32
     */
    public randomValues(size: number): Promise<Uint8Array> {
        return new Promise(async (resolve, reject) => {
            if (size > 32) {
                return reject(new Error("Size param is limited by 32"));
            }

            const clientRandom = this.clientRandomValues(size);

            try {
                const serverRandom = await this.serverRandomValues(size);

                const concat = new Uint8Array(2 * size);
                concat.set(clientRandom);
                concat.set(serverRandom, size);

                const hash = await this.crypto.subtle.digest("SHA-256", concat);

                return resolve(new Uint8Array(hash.slice(0, size)));
            } catch (e) {
                return resolve(clientRandom);
            }
        });
    }

    /**
     * It returns iv, which is used in encryption
     *
     * @return iv
     */
    public initializationVector(): Uint8Array {
        return this.iv;
    }

    /**
     * It exports key to printable string
     *
     * @return Promise exported key
     */
    public async exportedKey(): Promise<string> {
        const key: CryptoKey = await this.keyPromise;
        const buffer = await this.crypto.subtle.exportKey("raw", key);
        return Utils.Uint8ArrayToBase64(new Uint8Array(buffer));
    }

    /**
     * It encrypts metadata
     *
     * @param metadata
     * @return Promise with encrypted metadata
     */
    public async encryptMetadata(metadata: Metadata): Promise<Uint8Array> {
        const metadataArray: Uint8Array = metadata.toUint8Array();
        return await this.encryptChunk(metadataArray);
    }

    /**
     * It decrypts metadata
     *
     * @param metadata
     * @return Promise with decrypted metadata
     */
    public async decryptMetadata(metadata: Uint8Array): Promise<Metadata> {
        const decryptMetadata = await this.decryptChunk(metadata);
        return new Metadata(decryptMetadata);
    }

    /**
     * It encrypts any chunk of data
     *
     * @param chunk
     * @return Promise with encrypted chunk
     */
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

    /**
     * It decrypts any chunk of data
     *
     * @param chunk
     * @return Promise with encrypted chunk
     */
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

    /**
     * It creates key. If key param is available, there is used key defined in
     * param.
     *
     * @param key
     * @retun Promise with key
     */
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

    /**
     * It converts string representation of key to CryptoKey object
     *
     * @param key
     * @return Promise with key
     */
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

    /**
     * It generates key randomly.
     *
     * @return Promise with key
     */
    private async generateKey(): Promise<CryptoKey> {
        const random = await this.randomValues(Config.cipher.keyLength);

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

    /**
     * It derives the key from password by using PBKDF2
     *
     * @param pw
     * @return Promise with key
     */
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
            { name: "AES-GCM", length: Config.cipher.keyLength * 8 },
            true,
            ["encrypt", "decrypt"]
        );
    }
}
