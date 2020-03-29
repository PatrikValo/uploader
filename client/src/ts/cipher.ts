import { AesGcmDecryptor, AesGcmEncryptor } from "../js/aesGcm";
import Config from "./config";
import Utils from "./utils";

/**
 * It generates random values on client side.
 *
 * @param size
 * @return random values
 */
function clientRandomValues(size: number): Uint8Array {
    const buff = new Uint8Array(size);
    return window.crypto.getRandomValues(buff);
}

/**
 * It derives the key from password by using PBKDF2
 *
 * @param pw
 * @param salt
 * @return Promise with key
 */
async function deriveKey(
    pw: string,
    salt: Promise<Uint8Array>
): Promise<Uint8Array> {
    const buff = Utils.stringToUint8Array(pw);
    const s = await salt;

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        buff,
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    const key = await window.crypto.subtle.deriveKey(
        {
            hash: "SHA-256",
            iterations: Config.cipher.deriveIterations,
            name: "PBKDF2",
            salt: s
        },
        keyMaterial,
        { name: "AES-GCM", length: Config.cipher.keyLength * 8 },
        true,
        ["encrypt", "decrypt"]
    );

    const exported = await window.crypto.subtle.exportKey("raw", key);
    return new Uint8Array(exported);
}

/**
 * It downloads random values generated on server side.
 *
 * @param size
 * @return Promise with random values
 */
async function serverRandomValues(size: number): Promise<Uint8Array> {
    const url = Utils.serverClassicUrl("/api/random/" + size);
    const result = await Utils.getRequest(url, [], "arraybuffer");

    if (!result || result.byteLength !== size) {
        throw new Error("Incorrect response");
    }

    return new Uint8Array(result);
}

/**
 * It creates random values, which are combination of client and server
 * random values. Number of random values is limited by 64 values.
 * @param size
 * @throws Error object, if size param is greater than 64
 */
export function randomValues(size: number): Promise<Uint8Array> {
    return new Promise(async (resolve, reject) => {
        if (size > 64) {
            return reject(new Error("Size param is limited by 64"));
        }

        const clientRandom = clientRandomValues(size);

        try {
            const serverRandom = await serverRandomValues(size);

            const concat = new Uint8Array(2 * size);
            concat.set(clientRandom);
            concat.set(serverRandom, size);

            const hash = await window.crypto.subtle.digest("SHA-512", concat);

            return resolve(new Uint8Array(hash.slice(0, size)));
        } catch (e) {
            return resolve(clientRandom);
        }
    });
}

export class Encryption {
    private readonly ivPromise: Promise<Uint8Array>;
    private readonly keyPromise: Promise<Uint8Array>;
    private readonly aesPromise: Promise<AesGcmEncryptor>;
    private readonly saltPromise: Promise<Uint8Array>;

    constructor(password?: string);
    constructor(key: Uint8Array, iv?: Uint8Array);
    public constructor(keyMaterial?: string | Uint8Array, iv?: Uint8Array) {
        this.ivPromise = new Promise(resolve =>
            resolve(iv || randomValues(Config.cipher.ivLength))
        );

        if (typeof keyMaterial === "string") {
            const password = keyMaterial;
            this.saltPromise = randomValues(Config.cipher.saltLength);
            this.keyPromise = deriveKey(password, this.saltPromise);
        } else {
            this.saltPromise = new Promise(resolve =>
                resolve(new Uint8Array(Config.cipher.saltLength))
            );
            this.keyPromise = new Promise(resolve =>
                resolve(keyMaterial || randomValues(Config.cipher.keyLength))
            );
        }

        this.aesPromise = this.createAesEncryptor();
    }

    /**
     * It returns iv, which is used for encryption
     *
     * @return Promise with iv
     */
    public getInitializationVector(): Promise<Uint8Array> {
        return this.ivPromise;
    }

    /**
     * It returns key, which is used for encryption
     *
     * @return Promise with key
     */
    public getKey(): Promise<Uint8Array> {
        return this.keyPromise;
    }

    /**
     * It returns salt, which was used for deriving key from password. If password
     * wasn't used, it returns result, which contains only zeros. Length of salt
     * is defined in Config.cipher.saltLength
     *
     * @return Promise with salt
     */
    public getSalt(): Promise<Uint8Array> {
        return this.saltPromise;
    }

    /**
     * It encrypts the data, which is given
     * @param chunk
     * @return Promise with encrypted data
     */
    public async encrypt(chunk: Uint8Array): Promise<Uint8Array> {
        const encryptor = await this.aesPromise;
        return encryptor.update(chunk);
    }

    /**
     * It closes the current encryptor and it returns authTag
     * @return Promise with authTag
     */
    public async final(): Promise<Uint8Array> {
        const encryptor = await this.aesPromise;
        const final = encryptor.final();
        const tag = encryptor.getAuthTag();
        const returnValue = new Uint8Array(final.length + tag.length);
        returnValue.set(final);
        returnValue.set(tag, final.length);
        return returnValue;
    }

    /**
     * It creates new instance of encryptor, which is used for encrypting
     * file or metadata
     * @return Promise AES-GCM encryptor
     */
    private async createAesEncryptor(): Promise<AesGcmEncryptor> {
        const iv = await this.ivPromise;
        const key = await this.keyPromise;
        const { authTagLength, keyLength } = Config.cipher;
        const algorithm = `aes-${keyLength * 8}-gcm`;
        return new AesGcmEncryptor(algorithm, key, iv, { authTagLength });
    }
}

export class Decryption {
    private readonly ivPromise: Promise<Uint8Array>;
    private readonly keyPromise: Promise<Uint8Array>;
    private readonly aesPromise: Promise<AesGcmDecryptor>;

    constructor(key: Uint8Array, iv: Uint8Array);
    constructor(password: string, iv: Uint8Array, salt: Uint8Array);

    public constructor(
        keyMaterial: string | Uint8Array,
        iv: Uint8Array,
        salt?: Uint8Array
    ) {
        this.ivPromise = new Promise(resolve => resolve(iv));
        if (typeof keyMaterial === "string") {
            if (!salt) {
                throw new Error("Salt is not defined");
            }
            this.keyPromise = deriveKey(
                keyMaterial,
                new Promise(resolve => resolve(salt))
            );
        } else {
            this.keyPromise = new Promise(resolve => resolve(keyMaterial));
        }

        this.aesPromise = this.createAesDecryptor();
    }

    /**
     * It returns iv, which is used for decryption
     *
     * @return Promise with iv
     */
    public getInitializationVector(): Promise<Uint8Array> {
        return this.ivPromise;
    }

    /**
     * It returns key, which is used for decryption
     *
     * @return Promise with key
     */
    public getKey(): Promise<Uint8Array> {
        return this.keyPromise;
    }

    /**
     * It decrypts the data, which is given
     * @param chunk
     * @return Promise with decrypted data
     */
    public async decrypt(chunk: Uint8Array): Promise<Uint8Array> {
        const decryptor = await this.aesPromise;
        return decryptor.update(chunk);
    }

    /**
     * It checks correctness of authTag and decrypts last data before decryptor
     * is closed. AuthTag is part of chunk, which is given
     * to method as param or whole chunk param is authTag and nothing is decrypted.
     * @return Promise with decrypted data. If chunk param === only authTag
     * it returns empty Uint8Array
     */
    public async final(chunk: Uint8Array): Promise<Uint8Array> {
        const decryptor = await this.aesPromise;
        const { authTagLength } = Config.cipher;
        // separate authTag
        const tag = chunk.slice(-authTagLength);
        chunk = chunk.slice(0, -authTagLength);

        const result = decryptor.update(chunk);
        decryptor.setAuthTag(tag);
        decryptor.final();
        return result;
    }

    /**
     * It creates new instance of decryptor, which is used for decrypting
     * file or metadata
     * @return Promise AES-GCM decryptor
     */
    private async createAesDecryptor(): Promise<AesGcmDecryptor> {
        const iv = await this.ivPromise;
        const key = await this.keyPromise;
        const { authTagLength, keyLength } = Config.cipher;
        const algorithm = `aes-${keyLength * 8}-gcm`;
        return new AesGcmDecryptor(algorithm, key, iv, { authTagLength });
    }
}
