/**
 * Wrapper crypto-browserify for easy integrating AES-GCM to Typescript code
 */
import cryptoBrowserify from "crypto-browserify";
import safeBuffer from "safe-buffer";

export class AesGcmEncryptor {
    constructor(algorithm, key, iv, options) {
        const keyBuff = new safeBuffer.Buffer.from(key);
        const ivBuff = new safeBuffer.Buffer.from(iv);
        this.cipher = cryptoBrowserify.createCipheriv(
            algorithm,
            keyBuff,
            ivBuff,
            options
        );
    }

    update(chunk) {
        const chunkBuff = new safeBuffer.Buffer.from(chunk);
        const upd = this.cipher.update(chunkBuff);
        return new Uint8Array(
            upd.buffer,
            upd.byteOffset,
            upd.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }

    final() {
        const final = this.cipher.final();
        return new Uint8Array(
            final.buffer,
            final.byteOffset,
            final.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }

    getAuthTag() {
        const auth = this.cipher.getAuthTag();
        return new Uint8Array(
            auth.buffer,
            auth.byteOffset,
            auth.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }
}

export class AesGcmDecryptor {
    constructor(algorithm, key, iv, options) {
        const keyBuff = new safeBuffer.Buffer.from(key);
        const ivBuff = new safeBuffer.Buffer.from(iv);
        this.decipher = cryptoBrowserify.createDecipheriv(
            algorithm,
            keyBuff,
            ivBuff,
            options
        );
    }

    update(chunk) {
        const chunkBuff = new safeBuffer.Buffer.from(chunk);
        const upd = this.decipher.update(chunkBuff);
        return new Uint8Array(
            upd.buffer,
            upd.byteOffset,
            upd.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }

    final() {
        const final = this.decipher.final();
        return new Uint8Array(
            final.buffer,
            final.byteOffset,
            final.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }

    setAuthTag(tag) {
        const tagBuff = new safeBuffer.Buffer.from(tag);
        this.decipher.setAuthTag(tagBuff);
    }
}
