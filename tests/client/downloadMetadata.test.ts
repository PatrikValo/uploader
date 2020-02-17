import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import mock from "xhr-mock";
import AuthDropbox from "../../client/src/ts/authDropbox";
import Config from "../../client/src/ts/config";
import {
    DownloadMetadataDropbox,
    DownloadMetadataServer
} from "../../client/src/ts/downloadMetadata";
import Metadata from "../../client/src/ts/metadata";
import Utils from "../../client/src/ts/utils";

(window as any).TextEncoder = Encoder;
(window as any).TextDecoder = Decoder;

const token = "token125";
jest.mock("../../client/src/ts/authDropbox", () => {
    return class {
        public getAccessToken(): string {
            return token;
        }
    };
});

describe("DownloadMetadata test", () => {
    // FILE
    const chunk = [125];
    for (let i = 0; i < Config.client.chunkSize - 18; i++) {
        chunk.push(i);
    }
    chunk.push(125);

    const data = new Uint8Array(chunk);
    const blob = new Blob([data], { type: "application/javascript" });
    const file = new File([blob], "test.js");

    // IV
    const iv: number[] = [];
    for (let i = 0; i < Config.cipher.ivLength; i++) {
        iv.push(i);
    }

    // METADATA
    const metadata = new Metadata(file);
    const metadataArray = [].slice.call(metadata.toUint8Array());
    const c = Config.cipher;

    beforeEach(() => mock.setup());
    afterEach(() => mock.teardown());

    describe("DownloadMetadataServer test", () => {
        test("It should return correct metadata with password", async () => {
            const download = new DownloadMetadataServer("1234-56789-ad");
            const url = Utils.serverClassicUrl("/api/metadata/1234-56789-ad");
            const flags = [1];
            const salt = iv;

            mock.get(url, (req, res) => {
                const header = req.header("Range");
                expect(header).not.toBeNull();
                switch (header) {
                    case `bytes=0-${c.ivLength}`:
                        return res.status(200).body(new Uint8Array(iv));
                    case `bytes=${c.ivLength}-${c.ivLength + 1}`:
                        return res.status(200).body(new Uint8Array(flags));
                    case `bytes=${c.ivLength + 1}-${c.ivLength +
                        1 +
                        c.saltLength}`:
                        return res.status(200).body(new Uint8Array(salt));
                    case `bytes=${c.ivLength + 1 + c.saltLength}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2}`:
                        return res
                            .status(200)
                            .body(new Uint8Array([0, metadataArray.length]));
                    case `bytes=${c.ivLength +
                        1 +
                        c.saltLength +
                        2}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2 +
                        metadataArray.length}`:
                        return res
                            .status(200)
                            .body(new Uint8Array(metadataArray));
                    default:
                        return res.status(500).body(null);
                }
            });

            const resultPromise = download.download();
            await expect(resultPromise).resolves.toEqual({
                iv: new Uint8Array(iv),
                metadata: new Uint8Array(metadataArray),
                password: {
                    flag: true,
                    salt: new Uint8Array(salt)
                },
                startFrom:
                    c.ivLength + 1 + c.saltLength + 2 + metadataArray.length
            });
        });

        test("It should return correct metadata without password", async () => {
            const download = new DownloadMetadataServer("1234-56789-adc");
            const url = Utils.serverClassicUrl("/api/metadata/1234-56789-adc");
            const flags = [0];
            const salt = new Array(Config.cipher.saltLength);

            mock.get(url, (req, res) => {
                const header = req.header("Range");
                expect(header).not.toBeNull();
                switch (header) {
                    case `bytes=0-${c.ivLength}`:
                        return res.status(200).body(new Uint8Array(iv));
                    case `bytes=${c.ivLength}-${c.ivLength + 1}`:
                        return res.status(200).body(new Uint8Array(flags));
                    case `bytes=${c.ivLength + 1}-${c.ivLength +
                        1 +
                        c.saltLength}`:
                        return res.status(200).body(new Uint8Array(salt));
                    case `bytes=${c.ivLength + 1 + c.saltLength}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2}`:
                        return res
                            .status(200)
                            .body(new Uint8Array([0, metadataArray.length]));
                    case `bytes=${c.ivLength +
                        1 +
                        c.saltLength +
                        2}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2 +
                        metadataArray.length}`:
                        return res
                            .status(200)
                            .body(new Uint8Array(metadataArray));
                    default:
                        return res.status(500).body(null);
                }
            });

            const resultPromise = download.download();
            await expect(resultPromise).resolves.toEqual({
                iv: new Uint8Array(iv),
                metadata: new Uint8Array(metadataArray),
                password: {
                    flag: false,
                    salt: null
                },
                startFrom:
                    c.ivLength + 1 + c.saltLength + 2 + metadataArray.length
            });
        });

        test("It should throw Exception because empty response", async () => {
            const download = new DownloadMetadataServer("1234-56789-d");
            const url = Utils.serverClassicUrl("/api/metadata/1234-56789-d");

            mock.get(url, (req, res) => {
                const header = req.header("Range");
                expect(header).not.toBeNull();
                switch (header) {
                    case `bytes=0-${c.ivLength}`:
                        return res.status(200).body(new Uint8Array(iv));
                    case `bytes=${c.ivLength}-${c.ivLength + 1}`:
                        return res.status(200).body(null);
                    case `bytes=${c.ivLength + 1}-${c.ivLength +
                        1 +
                        c.saltLength}`:
                        return res.status(200).body(null);
                    case `bytes=${c.ivLength + 1 + c.saltLength}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2}`:
                        return res
                            .status(200)
                            .body(new Uint8Array([0, metadataArray.length]));
                    case `bytes=${c.ivLength +
                        1 +
                        c.saltLength +
                        2}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2 +
                        metadataArray.length}`:
                        return res
                            .status(200)
                            .body(new Uint8Array(metadataArray));
                    default:
                        return res.status(500).body(null);
                }
            });

            const resultPromise = download.download();
            await expect(resultPromise).rejects.not.toBeNull();
        });

        test("It should throw Exception because bad status", async () => {
            const download = new DownloadMetadataServer("1234-56789-ad");
            const url = Utils.serverClassicUrl("/api/metadata/1234-56789-ad");

            mock.get(url, (req, res) => {
                return res.status(500).body(null);
            });

            const resultPromise = download.download();
            await expect(resultPromise).rejects.toEqual(new Error("500"));
        });

        test("It should throw Exception because incorrect size of metadata", async () => {
            const download = new DownloadMetadataServer("1234-56789-ad");
            const url = Utils.serverClassicUrl("/api/metadata/1234-56789-ad");

            mock.get(url, (req, res) => {
                const header = req.header("Range");
                expect(header).not.toBeNull();
                switch (header) {
                    case `bytes=0-${c.ivLength}`:
                        return res.status(200).body(new Uint8Array(iv));
                    case `bytes=${c.ivLength}-${c.ivLength + 1}`:
                        return res.status(200).body(new Uint8Array([0]));
                    case `bytes=${c.ivLength + 1}-${c.ivLength +
                        1 +
                        c.saltLength}`:
                        return res
                            .status(200)
                            .body(new Uint8Array(c.saltLength));
                    case `bytes=${c.ivLength + 1 + c.saltLength}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2}`:
                        return res.status(200).body(new Uint8Array([0]));
                    default:
                        return res.status(500).body(null);
                }
            });

            const resultPromise = download.download();
            await expect(resultPromise).rejects.not.toBeNull();
        });

        test("It should throw Exception because server return smaller chunk", async () => {
            const download = new DownloadMetadataServer("1234-56789-ad");
            const url = Utils.serverClassicUrl("/api/metadata/1234-56789-ad");

            mock.get(url, (req, res) => {
                const header = req.header("Range");
                expect(header).not.toBeNull();
                if (header === `bytes=0-${c.ivLength}`) {
                    return res.status(200).body(new Uint8Array(iv.slice(1)));
                } else {
                    return res.status(200).body(new Uint8Array(0));
                }
            });

            const resultPromise = download.download();
            await expect(resultPromise).rejects.not.toBeNull();
        });
    });

    describe("DownloadMetadataDropbox test", () => {
        const auth = new AuthDropbox();
        const url = "https://content.dropboxapi.com/2/files/download";
        const id = "1234-56789-ad";
        test("It should return correct metadata with password", async () => {
            const download = new DownloadMetadataDropbox(id, auth);
            const flags = [1];
            const salt = iv;

            mock.get(url, (req, res) => {
                expect(req.header("authorization")).toEqual("Bearer " + token);
                expect(req.header("dropbox-api-arg")).toStrictEqual(
                    JSON.stringify({ path: "/" + id })
                );

                const header = req.header("Range");
                expect(header).not.toBeNull();
                switch (header) {
                    case `bytes=0-${c.ivLength - 1}`:
                        return res.status(200).body(new Uint8Array(iv));
                    case `bytes=${c.ivLength}-${c.ivLength}`:
                        return res.status(200).body(new Uint8Array(flags));
                    case `bytes=${c.ivLength + 1}-${c.ivLength +
                        1 +
                        c.saltLength -
                        1}`:
                        return res.status(200).body(new Uint8Array(salt));
                    case `bytes=${c.ivLength + 1 + c.saltLength}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2 -
                        1}`:
                        return res
                            .status(200)
                            .body(new Uint8Array([0, metadataArray.length]));
                    case `bytes=${c.ivLength +
                        1 +
                        c.saltLength +
                        2}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2 +
                        metadataArray.length -
                        1}`:
                        return res
                            .status(200)
                            .body(new Uint8Array(metadataArray));
                    default:
                        return res.status(500).body(null);
                }
            });

            const resultPromise = download.download();
            await expect(resultPromise).resolves.toEqual({
                iv: new Uint8Array(iv),
                metadata: new Uint8Array(metadataArray),
                password: {
                    flag: true,
                    salt: new Uint8Array(salt)
                },
                startFrom:
                    c.ivLength + 1 + c.saltLength + 2 + metadataArray.length
            });
        });

        test("It should return correct metadata without password", async () => {
            const download = new DownloadMetadataDropbox(id, auth);
            const flags = [0];
            const salt = new Array(Config.cipher.saltLength);

            mock.get(url, (req, res) => {
                expect(req.header("authorization")).toEqual("Bearer " + token);
                expect(req.header("dropbox-api-arg")).toStrictEqual(
                    JSON.stringify({ path: "/" + id })
                );

                const header = req.header("Range");
                expect(header).not.toBeNull();
                switch (header) {
                    case `bytes=0-${c.ivLength - 1}`:
                        return res.status(200).body(new Uint8Array(iv));
                    case `bytes=${c.ivLength}-${c.ivLength}`:
                        return res.status(200).body(new Uint8Array(flags));
                    case `bytes=${c.ivLength + 1}-${c.ivLength +
                        1 +
                        c.saltLength -
                        1}`:
                        return res.status(200).body(new Uint8Array(salt));
                    case `bytes=${c.ivLength + 1 + c.saltLength}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2 -
                        1}`:
                        return res
                            .status(200)
                            .body(new Uint8Array([0, metadataArray.length]));
                    case `bytes=${c.ivLength +
                        1 +
                        c.saltLength +
                        2}-${c.ivLength +
                        1 +
                        c.saltLength +
                        2 +
                        metadataArray.length -
                        1}`:
                        return res
                            .status(200)
                            .body(new Uint8Array(metadataArray));
                    default:
                        return res.status(500).body(null);
                }
            });

            const resultPromise = download.download();
            await expect(resultPromise).resolves.toEqual({
                iv: new Uint8Array(iv),
                metadata: new Uint8Array(metadataArray),
                password: {
                    flag: false,
                    salt: null
                },
                startFrom:
                    c.ivLength + 1 + c.saltLength + 2 + metadataArray.length
            });
        });

        test("It should throw Exception because empty response", async () => {
            const download = new DownloadMetadataDropbox(id, auth);

            mock.get(url, (req, res) => {
                expect(req.header("authorization")).toEqual("Bearer " + token);
                expect(req.header("dropbox-api-arg")).toStrictEqual(
                    JSON.stringify({ path: "/" + id })
                );
                const header = req.header("Range");
                expect(header).not.toBeNull();
                if (header === `bytes=0-${c.ivLength - 1}`) {
                    return res.status(200).body(new Uint8Array(0));
                } else {
                    return res.status(200).body(new Uint8Array(12));
                }
            });

            const resultPromise = download.download();
            await expect(resultPromise).rejects.not.toBeNull();
        });

        test("It should throw Exception because server return smaller chunk", async () => {
            const download = new DownloadMetadataDropbox(id, auth);

            mock.get(url, (req, res) => {
                expect(req.header("authorization")).toEqual("Bearer " + token);
                expect(req.header("dropbox-api-arg")).toStrictEqual(
                    JSON.stringify({ path: "/" + id })
                );
                const header = req.header("Range");
                expect(header).not.toBeNull();
                if (header === `bytes=0-${c.ivLength - 1}`) {
                    return res.status(200).body(new Uint8Array(iv.slice(1)));
                } else {
                    return res.status(200).body(new Uint8Array(0));
                }
            });

            const resultPromise = download.download();
            await expect(resultPromise).rejects.not.toBeNull();
        });
    });
});
