import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import mock from "xhr-mock";
import {
    Decryption,
    Encryption,
    randomValues
} from "../../client/src/ts/cipher";
import Config from "../../client/src/ts/config";
import Utils from "../../client/src/ts/utils";
import Crypto from "./tmp/subtle";

(window as any).TextEncoder = Encoder;
(window as any).TextDecoder = Decoder;
// remove randomness
(window as any).crypto = new Crypto();

// catch get request for random values
mock.setup();
mock.get(/random\/*/, (req, res) => {
    return res.status(404);
});

const { ivLength, keyLength, saltLength } = Config.cipher;

describe("Cipher tests", () => {
    describe("Encryption tests", () => {
        describe("new Encryption()", () => {
            const a = new Encryption();
            test("It should create random key and iv", async () => {
                // mock random function
                const key = await randomValues(keyLength);
                const iv = await randomValues(ivLength);

                await expect(
                    a.getInitializationVector()
                ).resolves.toStrictEqual(iv);

                await expect(a.getEncryptionKey()).resolves.toStrictEqual(key);
            });

            test("It should use same key for encryption and exporting", async () => {
                const enc = await a.getEncryptionKey();
                const encBase64 = Utils.Uint8ArrayToBase64(enc);

                await expect(a.getExportedKey()).resolves.toEqual(encBase64);
            });
        });

        describe("new Encryption(password)", () => {
            const a = new Encryption("password");
            test("It should combine keys and create random iv", async () => {
                // mock digest function
                const correctEncryption = new Uint8Array(keyLength).fill(8);

                const iv = await randomValues(ivLength);

                await expect(
                    a.getInitializationVector()
                ).resolves.toStrictEqual(iv);

                await expect(a.getEncryptionKey()).resolves.toStrictEqual(
                    correctEncryption
                );
            });

            test("It should use different key for encryption and exporting", async () => {
                const enc = await a.getEncryptionKey();
                const encBase64 = Utils.Uint8ArrayToBase64(enc);
                const key = await randomValues(keyLength);
                const keyBase64 = Utils.Uint8ArrayToBase64(key);

                await expect(a.getExportedKey()).resolves.not.toEqual(
                    encBase64
                );
                await expect(a.getExportedKey()).resolves.toEqual(keyBase64);
            });
        });

        describe("Reset", () => {
            const a = new Encryption("password");
            test("It should set new iv and key should be same", async () => {
                const correctEncryption = new Uint8Array(keyLength).fill(8);
                const correctExportable = Utils.Uint8ArrayToBase64(
                    await randomValues(keyLength)
                );

                const oldIV = await randomValues(ivLength);
                const newIV = new Uint8Array(ivLength).fill(244);

                await expect(
                    a.getInitializationVector()
                ).resolves.toStrictEqual(oldIV);

                await expect(a.getEncryptionKey()).resolves.toStrictEqual(
                    correctEncryption
                );

                await expect(a.getExportedKey()).resolves.toEqual(
                    correctExportable
                );

                // reset
                a.reset(newIV);

                await expect(
                    a.getInitializationVector()
                ).resolves.toStrictEqual(newIV);

                await expect(a.getEncryptionKey()).resolves.toStrictEqual(
                    correctEncryption
                );

                await expect(a.getExportedKey()).resolves.toEqual(
                    correctExportable
                );
            });
        });
    });

    describe("Decryption tests", () => {
        describe("new Decryption(base64, iv)", () => {
            test("It should convert base64 to Uint8Array", async () => {
                const key = new Uint8Array(keyLength).fill(25);
                const base64 = Utils.Uint8ArrayToBase64(key);

                const a = new Decryption(base64, new Uint8Array(ivLength));

                await expect(a.getDecryptionKey()).resolves.toStrictEqual(key);
            });
        });

        describe("new Decryption(key, iv)", () => {
            test("It should use same key", async () => {
                const key = new Uint8Array(keyLength).fill(25);

                const a = new Decryption(key, new Uint8Array(ivLength));

                await expect(a.getDecryptionKey()).resolves.toStrictEqual(key);
            });
        });

        describe("new Decryption(key, iv, password, salt)", () => {
            test("It should combine keys", async () => {
                const key = new Uint8Array(keyLength).fill(25);

                const a = new Decryption(
                    key,
                    new Uint8Array(ivLength),
                    "password",
                    new Uint8Array(saltLength)
                );

                const correctKey = new Uint8Array(keyLength).fill(8);
                await expect(a.getDecryptionKey()).resolves.toStrictEqual(
                    correctKey
                );
            });
        });

        describe("Bad constructors", () => {
            test("It should throw error, because key is too small", async () => {
                const key = new Uint8Array(2).fill(25);

                const a = new Decryption(key, new Uint8Array(ivLength));

                await expect(
                    a.decrypt(new Uint8Array(0))
                ).rejects.not.toBeNull();
            });

            test("It should throw error, because salt is not given", async () => {
                const key = new Uint8Array(keyLength).fill(25);
                expect(() => {
                    const a = new Decryption(
                        key,
                        new Uint8Array(ivLength),
                        "password",
                        null as any
                    );
                }).toThrow();
            });

            test("It should throw error, because iv is not valid", async () => {
                const key = new Uint8Array(keyLength).fill(25);
                expect(() => {
                    const a = new Decryption(key, new Uint8Array(0));
                }).toThrow();
            });
        });
    });
});
