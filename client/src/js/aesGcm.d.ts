export = AesGcm;

type CipherGCMTypes = "aes-128-gcm" | "aes-192-gcm" | "aes-256-gcm";

// tslint:disable-next-line:no-namespace
declare namespace AesGcm {
    class AesGcmEncryptor {
        constructor(
            algorithm: CipherGCMTypes | CipherCCMTypes,
            key: Uint8Array,
            iv: Uint8Array,
            options?: { authTagLength?: number }
        ): Uint8Array;
        public update(chunk: Uint8Array): Uint8Array;
        public final(): Uint8Array;
        public getAuthTag(): Uint8Array;
    }

    class AesGcmDecryptor {
        constructor(
            algorithm: CipherGCMTypes | CipherCCMTypes,
            key: Uint8Array,
            iv: Uint8Array,
            options?: { authTagLength?: number }
        ): Uint8Array;
        public update(chunk: Uint8Array): Uint8Array;
        public final(): Uint8Array;
        public setAuthTag(tag: Uint8Array): void;
    }
}
