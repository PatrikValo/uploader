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

/**
 * It creates key, which is combination of key1 and key2 params. For this
 * purpose it uses sha-512 function.
 *
 * @param k1 - first key
 * @param k2 - second key
 * @return Promise with key
 */
async function createKeyFromKeys(
    k1: Promise<Uint8Array>,
    k2: Promise<Uint8Array>
): Promise<Uint8Array> {
    const key1 = await k1;
    const key2 = await k2;

    const concat = new Uint8Array(key1.length + key2.length);
    concat.set(key1);
    concat.set(key2, key1.length);

    const mixed = await window.crypto.subtle.digest("sha-512", concat);
    return new Uint8Array(mixed).slice(0, Config.cipher.keyLength);
}

export class Encryption {
    private ivPromise: Promise<Uint8Array>;
    private readonly exportableKey: Promise<Uint8Array>;
    private readonly keyPromise: Promise<Uint8Array>;
    private aesPromise: Promise<AesGcmEncryptor>;
    private readonly saltPromise: Promise<Uint8Array>;

    public constructor(password?: string) {
        const { ivLength, keyLength, saltLength } = Config.cipher;

        this.ivPromise = randomValues(ivLength);

        // password
        if (password) {
            this.saltPromise = randomValues(saltLength);
            this.exportableKey = randomValues(keyLength);
            const pwKey = pbkdf2(password, this.saltPromise);

            this.keyPromise = createKeyFromKeys(this.exportableKey, pwKey);
            this.aesPromise = this.createAesEncryptor();
            return;
        }

        // without password
        this.saltPromise = Promise.resolve(new Uint8Array(saltLength));
        this.keyPromise = randomValues(keyLength);
        this.exportableKey = this.keyPromise;
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
     * It returns key in base64 format, which can be part of URL.
     * In case password was defined, this key is different that
     * encryption key
     *
     * @return key in base64 format.
     */
    public async getExportedKey(): Promise<string> {
        const exportableKey = await this.exportableKey;
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

        const returnValue = new Uint8Array(final.length + tag.length);
        returnValue.set(final);
        returnValue.set(tag, final.length);
        return returnValue;
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

    constructor(keyMaterial: string | Uint8Array, iv: Uint8Array);
    constructor(
        keyMaterial: string | Uint8Array,
        iv: Uint8Array,
        password: string,
        salt: Uint8Array
    );
    /**
     * It constructs new instance of Decryption class.
     *
     * @param keyMaterial - if type of keyMaterial is string,
     * the key is in base64 format, otherwise key is raw
     * @param iv - initialization vector
     * @param password - if password is defined, salt must be defined also
     * @param salt
     */
    public constructor(
        keyMaterial: string | Uint8Array,
        iv: Uint8Array,
        password?: string,
        salt?: Uint8Array
    ) {
        if (iv.length !== Config.cipher.ivLength) {
            throw new Error("IV is not valid");
        }

        this.ivPromise = Promise.resolve(iv);

        const key: Promise<Uint8Array> =
            typeof keyMaterial === "string"
                ? Promise.resolve(Utils.base64toUint8Array(keyMaterial))
                : Promise.resolve(keyMaterial);

        // password
        if (password) {
            if (!salt) {
                throw new Error("Salt must be defined");
            }
            const pwKey = pbkdf2(password, Promise.resolve(salt));

            this.keyPromise = createKeyFromKeys(key, pwKey);
            this.aesPromise = this.createAesDecryptor();
            return;
        }

        // without password
        this.keyPromise = key;
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
