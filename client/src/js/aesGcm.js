import cryptoBrowserify from "crypto-browserify";
import safeBuffer from "safe-buffer";

export class AesGcmEncryptor {
    constructor(algorithm, key, iv, options) {
        const keyBuff = new safeBuffer.Buffer(key);
        const ivBuff = new safeBuffer.Buffer(iv);
        this.cipher = cryptoBrowserify.createCipheriv(
            algorithm,
            keyBuff,
            ivBuff,
            options
        );
    }

    update(chunk) {
        const chunkBuff = new safeBuffer.Buffer(chunk);
        return this.cipher.update(chunkBuff);
    }

    final() {
        return this.cipher.final();
    }

    getAuthTag() {
        return this.cipher.getAuthTag();
    }
}

export class AesGcmDecryptor {
    constructor(algorithm, key, iv, options) {
        const keyBuff = new safeBuffer.Buffer(key);
        const ivBuff = new safeBuffer.Buffer(iv);
        this.decipher = cryptoBrowserify.createDecipheriv(
            algorithm,
            keyBuff,
            ivBuff,
            options
        );
    }

    update(chunk) {
        const chunkBuff = new safeBuffer.Buffer(chunk);
        return this.decipher.update(chunkBuff);
    }

    final() {
        return this.decipher.final();
    }

    setAuthTag(tag) {
        this.decipher.setAuthTag(tag);
    }
}
