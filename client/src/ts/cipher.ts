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
 * random values. If server isn't available, only client values are returned.
 * Number of random values is limited by 64 values.
 *
 * @param size - length of Uint8Array, which contains random values
 * @return Promise with random values
 */
export function randomValues(size: number): Promise<Uint8Array> {
    return new Promise(async (resolve, reject) => {
        if (size > 64) {
            return reject(new Error("Size param is limited by 64"));
        }

        const clientRandom = clientRandomValues(size);

        try {
            const serverRandom = await serverRandomValues(size);

            const concat = Utils.concatUint8Arrays(clientRandom, serverRandom);

            const hash = await window.crypto.subtle.digest("SHA-512", concat);

            return resolve(new Uint8Array(hash.slice(0, size)));
        } catch (e) {
            return resolve(clientRandom);
        }
    });
}

/**
 * It derives the key from password and salt by using PBKDF2
 *
 * @param pw - password
 * @param s - salt
 * @return Promise with key
 */
async function pbkdf2(pw: string, s: Promise<Uint8Array>): Promise<Uint8Array> {
    const buff = Utils.stringToUint8Array(pw);
    const salt = await s;

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        buff,
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    const derived = await window.crypto.subtle.deriveKey(
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

    const key = await window.crypto.subtle.exportKey("raw", derived);
    return new Uint8Array(key);
}

export class Encryption {
    private ivPromise: Promise<Uint8Array>;
    private readonly exportableKeyPromise: Promise<Uint8Array>;
    private readonly keyPromise: Promise<Uint8Array>;
    private aesPromise: Promise<AesGcmEncryptor>;

    public constructor(password?: string) {
        const { ivLength, keyLength, saltLength } = Config.cipher;

        this.ivPromise = randomValues(ivLength);

        // password
        if (password) {
            this.exportableKeyPromise = randomValues(saltLength);

            this.keyPromise = pbkdf2(password, this.exportableKeyPromise);
            this.aesPromise = this.createAesEncryptor();
            return;
        }

        // without password
        this.keyPromise = randomValues(keyLength);
        this.exportableKeyPromise = this.keyPromise;
        this.aesPromise = this.createAesEncryptor();
    }

    /**
     * It returns iv, which is used for encryption. Length of iv is defined in
     * Config.cipher.ivLength.
     *
     * @return Promise with iv
     */
    public getInitializationVector(): Promise<Uint8Array> {
        return this.ivPromise;
    }

    /**
     * It return key, which is used for encryption.
     *
     * @return Promise with key
     */
    public getEncryptionKey(): Promise<Uint8Array> {
        return this.keyPromise;
    }

    /**
     * It returns fragment in base64 format, which can be part of URL.
     * If password is defined, fragment is exported salt, which was used
     * for deriving encryption key OTHERWISE fragment is exported encryption key
     *
     * @return fragment in base64 format.
     */
    public async getExportedFragment(): Promise<string> {
        const exportableKey = await this.exportableKeyPromise;
        return Utils.Uint8ArrayToBase64(exportableKey);
    }

    /**
     * It encrypts chunk of the data, which is given.
     *
     * @param chunk
     * @return Promise with encrypted data
     */
    public async encrypt(chunk: Uint8Array): Promise<Uint8Array> {
        const encryptor = await this.aesPromise;
        return encryptor.update(chunk);
    }

    /**
     * It closes the current encryptor and it returns authTag.
     *
     * @return Promise with authTag
     */
    public async final(): Promise<Uint8Array> {
        const encryptor = await this.aesPromise;
        const final = encryptor.final();
        const tag = encryptor.getAuthTag();

        return Utils.concatUint8Arrays(final, tag);
    }

    /**
     * It resets the encryptor and it sets up new iv for encryptor.
     *
     * @param newIV
     */
    public reset(newIV?: Uint8Array): void {
        this.ivPromise = Promise.resolve(
            newIV || randomValues(Config.cipher.ivLength)
        );
        this.aesPromise = this.createAesEncryptor();
    }

    /**
     * It creates new instance of encryptor, which is used for encrypting
     * file or metadata. It uses ivPromise and keyPromise for that, so
     * these attributes must be defined.
     *
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

    constructor(key: string | Uint8Array, iv: Uint8Array);
    constructor(salt: string, iv: Uint8Array, password: string);
    public constructor(
        keyOrSalt: string | Uint8Array,
        iv: Uint8Array,
        password?: string
    ) {
        if (iv.length !== Config.cipher.ivLength) {
            throw new Error("IV is not valid");
        }

        this.ivPromise = Promise.resolve(iv);

        // convert to Uint8Array
        const uint8Array =
            typeof keyOrSalt === "string"
                ? Utils.base64toUint8Array(keyOrSalt)
                : keyOrSalt;

        // password
        if (password) {
            const salt = uint8Array;

            if (!salt || salt.length !== Config.cipher.saltLength) {
                throw new Error("Salt is not valid");
            }

            this.keyPromise = pbkdf2(password, Promise.resolve(salt));
            this.aesPromise = this.createAesDecryptor();
            return;
        }

        // without password
        const key = uint8Array;
        if (key.length !== Config.cipher.keyLength) {
            throw new Error("Key is not valid");
        }
        this.keyPromise = Promise.resolve(key);
        this.aesPromise = this.createAesDecryptor();
    }

    /**
     * It returns key, which is used for decryption.
     *
     * @return Promise with key
     */
    public getDecryptionKey(): Promise<Uint8Array> {
        return this.keyPromise;
    }

    /**
     * It decrypts chunk of the data, which is given.
     *
     * @param chunk
     * @return Promise with decrypted data
     */
    public async decrypt(chunk: Uint8Array): Promise<Uint8Array> {
        const decryptor = await this.aesPromise;
        return decryptor.update(chunk);
    }

    /**
     * It checks correctness of authTag and it decrypts last data before decryptor
     * is closed. AuthTag is part of chunk param and the other part is decrypted,
     * or whole chunk param is authTag and nothing is decrypted.
     *
     * @throws Error if authTag is invalid
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

        // it can throw exception, if authTag is invalid
        decryptor.final();
        return result;
    }

    /**
     * It creates new instance of decryptor, which is used for decrypting
     * file or metadata. It uses ivPromise and keyPromise for that, so
     * these attributes must be defined.
     *
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
