import Cipher from "./cipher";

export default class Password {
    public readonly pw: string;
    public readonly salt: Uint8Array;

    public constructor(pw: string, salt?: Uint8Array) {
        this.pw = pw;
        this.salt = salt || window.crypto.getRandomValues(new Uint8Array(16));
    }

    public async equalToBase64(key: string): Promise<boolean> {
        const passwordKey = await Cipher.importPassword(this.pw, this.salt);
        const base64 = await Cipher.exportKey(passwordKey);
        return key === base64;
    }
}
