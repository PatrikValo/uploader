import cryptoBrowserify from "crypto-browserify";
import safeBuffer from "safe-buffer";

export class AesGcmEncryptor {
    constructor(key, iv) {
        const len = key.length;
        if (len !== 16 && len !== 32) {
            throw new Error("Not supported key");
        }

        const mode = `aes-${len * 8}-gcm`;
        const keyBuff = new safeBuffer.Buffer(key);
        const ivBuff = new safeBuffer.Buffer(iv);
        this.cipher = cryptoBrowserify.createCipheriv(mode, keyBuff, ivBuff);
    }

    update(chunk) {
        const chunkBuff = new safeBuffer.Buffer(chunk);
        const returnValue = this.cipher.update(chunkBuff);
        return new Uint8Array(
            returnValue.buffer,
            returnValue.byteOffset,
            returnValue.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }

    final() {
        const returnValue = this.cipher.final();
        return new Uint8Array(
            returnValue.buffer,
            returnValue.byteOffset,
            returnValue.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }

    getAuthTag() {
        const returnValue = this.cipher.getAuthTag();
        return new Uint8Array(
            returnValue.buffer,
            returnValue.byteOffset,
            returnValue.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }
}

export class AesGcmDecryptor {
    constructor(key, iv) {
        const len = key.length;
        if (len !== 16 && len !== 32) {
            throw new Error("Not supported key");
        }

        const mode = `aes-${len * 8}-gcm`;
        const keyBuff = new safeBuffer.Buffer(key);
        const ivBuff = new safeBuffer.Buffer(iv);
        this.decipher = cryptoBrowserify.createDecipheriv(
            mode,
            keyBuff,
            ivBuff
        );
    }

    update(chunk) {
        const chunkBuff = new safeBuffer.Buffer(chunk);
        const returnValue = this.decipher.update(chunkBuff);
        return new Uint8Array(
            returnValue.buffer,
            returnValue.byteOffset,
            returnValue.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }

    final() {
        const returnValue = this.decipher.final();
        return new Uint8Array(
            returnValue.buffer,
            returnValue.byteOffset,
            returnValue.byteLength / Uint8Array.BYTES_PER_ELEMENT
        );
    }

    setAuthTag(tag) {
        this.decipher.setAuthTag(tag);
    }
}
