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

jest.mock("../../client/src/ts/cipher", () => {
    return class {
        private readonly key: string;
        public constructor(key: string) {
            this.key = key;
        }
        public async decryptMetadata(m: Uint8Array): Promise<Metadata> {
            if (this.key === "NotCorrect") {
                throw new Error("Key is not correct");
            }
            const decryptMetadata = await this.decryptChunk(m);
            return new Metadata(decryptMetadata);
        }

        public async decryptChunk(ch: Uint8Array): Promise<Uint8Array> {
            return new Promise(resolve => {
                resolve(ch);
            });
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
    const iv = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    // METADATA
    const metadata = new Metadata(file);
    const metadataArray = [].slice.call(metadata.toUint8Array());

    beforeEach(() => mock.setup());
    afterEach(() => mock.teardown());

    test("It should return correct metadata", async () => {
        const download = new DownloadMetadata("1234-56789-ad", "aXr+daReE==");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-ad");

        mock.get(url, (req, res) => {
            const obj = {
                iv: {
                    data: iv,
                    type: "Buffer"
                },
                metadata: {
                    data: metadataArray,
                    type: "Buffer"
                }
            };
            return res.status(200).body(JSON.stringify(obj));
        });

        const resultPromise = download.download();
        await expect(resultPromise).resolves.toEqual({
            iv: new Uint8Array(iv),
            metadata
        });
    });

    test("It should throw Exception because key is not correct", async () => {
        const download = new DownloadMetadata("1234-56789-d", "NotCorrect");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-d");

        mock.get(url, (req, res) => {
            const obj = {
                iv: {
                    data: iv,
                    type: "Buffer"
                },
                metadata: {
                    data: metadataArray,
                    type: "Buffer"
                }
            };
            return res.status(200).body(JSON.stringify(obj));
        });

        const resultPromise = download.download();
        await expect(resultPromise).rejects.toEqual(
            new Error("Key is not correct")
        );
    });

    test("It should throw Exception because bad status", async () => {
        const download = new DownloadMetadata("1234-56789-ad", "aXr+daReE==");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-ad");

        mock.get(url, (req, res) => {
            return res.status(500).body(null);
        });

        const resultPromise = download.download();
        await expect(resultPromise).rejects.toEqual(new Error("500"));
    });

    test("It should throw Exception because empty response", async () => {
        const download = new DownloadMetadata("1234-56789-ad", "aXr+daReE==");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-ad");

        mock.get(url, (req, res) => {
            return res.status(200).body(null);
        });

        const resultPromise = download.download();
        await expect(resultPromise).rejects.toEqual(
            new Error("Response is empty")
        );
    });
});
