export = AesGcm;

// tslint:disable-next-line:no-namespace
declare namespace AesGcm {
    class AesGcmEncryptor {
        constructor(key: Uint8Array, iv: Uint8Array): Uint8Array;
        public update(chunk: Uint8Array): Uint8Array;
        public final(): Uint8Array;
        public getAuthTag(): Uint8Array;
    }

    class AesGcmDecryptor {
        constructor(key: Uint8Array, iv: Uint8Array): Uint8Array;
        public update(chunk: Uint8Array): Uint8Array;
        public final(): Uint8Array;
        public setAuthTag(tag: Uint8Array): void;
    }
}
