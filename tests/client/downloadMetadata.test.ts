import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import mock from "xhr-mock";
import Config from "../../client/src/ts/config";
import DownloadMetadata from "../../client/src/ts/downloadMetadata";
import Metadata from "../../client/src/ts/metadata";
import Utils from "../../client/src/ts/utils";

(window as any).TextEncoder = Encoder;
(window as any).TextDecoder = Decoder;

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
    const iv = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    // METADATA
    const metadata = new Metadata(file);
    const metadataArray = [].slice.call(metadata.toUint8Array());
    const c = Config.cipher;

    beforeEach(() => mock.setup());
    afterEach(() => mock.teardown());

    test("It should return correct metadata with password", async () => {
        const download = new DownloadMetadata("1234-56789-ad");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-ad");
        const flags = [1];
        const salt = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

        mock.get(url, (req, res) => {
            const header = req.header("Range");
            expect(header).not.toBeNull();
            switch (header) {
                case `bytes=0-${c.ivLength}`:
                    return res.status(200).body(new Uint8Array(iv));
                case `bytes=${c.ivLength}-${c.ivLength + 1}`:
                    return res.status(200).body(new Uint8Array(flags));
                case `bytes=${c.ivLength + 1}-${c.ivLength + 1 + c.saltLength}`:
                    return res.status(200).body(new Uint8Array(salt));
                case `bytes=${c.ivLength + 1 + c.saltLength}-${c.ivLength +
                    1 +
                    c.saltLength +
                    2}`:
                    return res
                        .status(200)
                        .body(new Uint8Array([0, metadataArray.length]));
                case `bytes=${c.ivLength + 1 + c.saltLength + 2}-${c.ivLength +
                    1 +
                    c.saltLength +
                    2 +
                    metadataArray.length}`:
                    return res.status(200).body(new Uint8Array(metadataArray));
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
            startFrom: c.ivLength + 1 + c.saltLength + 2 + metadataArray.length
        });
    });

    test("It should return correct metadata without password", async () => {
        const download = new DownloadMetadata("1234-56789-adc");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-adc");
        const flags = [0];
        const salt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        mock.get(url, (req, res) => {
            const header = req.header("Range");
            expect(header).not.toBeNull();
            switch (header) {
                case `bytes=0-${c.ivLength}`:
                    return res.status(200).body(new Uint8Array(iv));
                case `bytes=${c.ivLength}-${c.ivLength + 1}`:
                    return res.status(200).body(new Uint8Array(flags));
                case `bytes=${c.ivLength + 1}-${c.ivLength + 1 + c.saltLength}`:
                    return res.status(200).body(new Uint8Array(salt));
                case `bytes=${c.ivLength + 1 + c.saltLength}-${c.ivLength +
                    1 +
                    c.saltLength +
                    2}`:
                    return res
                        .status(200)
                        .body(new Uint8Array([0, metadataArray.length]));
                case `bytes=${c.ivLength + 1 + c.saltLength + 2}-${c.ivLength +
                    1 +
                    c.saltLength +
                    2 +
                    metadataArray.length}`:
                    return res.status(200).body(new Uint8Array(metadataArray));
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
            startFrom: c.ivLength + 1 + c.saltLength + 2 + metadataArray.length
        });
    });

    test("It should throw Exception because empty response", async () => {
        const download = new DownloadMetadata("1234-56789-d");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-d");

        mock.get(url, (req, res) => {
            const header = req.header("Range");
            expect(header).not.toBeNull();
            switch (header) {
                case `bytes=0-${c.ivLength}`:
                    return res.status(200).body(new Uint8Array(iv));
                case `bytes=${c.ivLength}-${c.ivLength + 1}`:
                    return res.status(200).body(null);
                case `bytes=${c.ivLength + 1}-${c.ivLength + 1 + c.saltLength}`:
                    return res.status(200).body(null);
                case `bytes=${c.ivLength + 1 + c.saltLength}-${c.ivLength +
                    1 +
                    c.saltLength +
                    2}`:
                    return res
                        .status(200)
                        .body(new Uint8Array([0, metadataArray.length]));
                case `bytes=${c.ivLength + 1 + c.saltLength + 2}-${c.ivLength +
                    1 +
                    c.saltLength +
                    2 +
                    metadataArray.length}`:
                    return res.status(200).body(new Uint8Array(metadataArray));
                default:
                    return res.status(500).body(null);
            }
        });

        const resultPromise = download.download();
        await expect(resultPromise).rejects.toEqual(
            new Error("Response is empty")
        );
    });

    test("It should throw Exception because bad status", async () => {
        const download = new DownloadMetadata("1234-56789-ad");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-ad");

        mock.get(url, (req, res) => {
            return res.status(500).body(null);
        });

        const resultPromise = download.download();
        await expect(resultPromise).rejects.toEqual(new Error("500"));
    });

    test("It should throw Exception because incorrect size of metadata", async () => {
        const download = new DownloadMetadata("1234-56789-ad");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-ad");

        mock.get(url, (req, res) => {
            const header = req.header("Range");
            expect(header).not.toBeNull();
            switch (header) {
                case `bytes=0-${c.ivLength}`:
                    return res.status(200).body(new Uint8Array(iv));
                case `bytes=${c.ivLength}-${c.ivLength + 1}`:
                    return res.status(200).body(new Uint8Array([0]));
                case `bytes=${c.ivLength + 1}-${c.ivLength + 1 + c.saltLength}`:
                    return res.status(200).body(new Uint8Array(c.saltLength));
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
        await expect(resultPromise).rejects.toEqual(
            new Error("Incorrect size")
        );
    });
});
