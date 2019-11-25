import mock from "xhr-mock";
import Config from "../../client/src/ts/config";
import DownloadMetadata from "../../client/src/ts/downloadMetadata";
import Metadata from "../../client/src/ts/metadata";
import Utils from "../../client/src/ts/utils";

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

// CIPHER MOCK
let checkMetadataUint: jest.Mock;
jest.mock("../../client/src/ts/cipher", () => {
    return class {
        public async decryptMetadata(m: Uint8Array): Promise<Metadata> {
            // check if this method is calling with expected input
            const result = checkMetadataUint(m);
            if (result) {
                // simulate bad key error
                throw result;
            }
            const decryptMetadata = await this.decryptChunk(m);
            // instead of creating metadata from Uint8Array (due to TextDecoder), return correct metadata
            return metadata;
        }

        public async decryptChunk(ch: Uint8Array): Promise<Uint8Array> {
            return new Promise(resolve => {
                resolve(ch);
            });
        }
    };
});

describe("DownloadMetadata test", () => {
    beforeEach(() => {
        mock.setup();
        checkMetadataUint = jest.fn().mockReturnValue(null);
    });
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
                    data: [0, 1, 25, 255],
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

        expect(checkMetadataUint.mock.calls[0][0]).toEqual(
            new Uint8Array([0, 1, 25, 255])
        );
    });

    test("It should throw Exception because key is not correct", async () => {
        const download = new DownloadMetadata("1234-56789-d", "aXr+daReE==");
        const url = Utils.server.classicUrl("/api/metadata/1234-56789-d");
        checkMetadataUint = jest.fn().mockReturnValue(new Error("key"));

        mock.get(url, (req, res) => {
            const obj = {
                iv: {
                    data: iv,
                    type: "Buffer"
                },
                metadata: {
                    data: [0, 1, 15],
                    type: "Buffer"
                }
            };
            return res.status(200).body(JSON.stringify(obj));
        });

        const resultPromise = download.download();
        await expect(resultPromise).rejects.toEqual(
            new Error("Key is not correct")
        );

        expect(checkMetadataUint.mock.calls[0][0]).toEqual(
            new Uint8Array([0, 1, 15])
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
        expect(checkMetadataUint).not.toBeCalled();
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
        expect(checkMetadataUint).not.toBeCalled();
    });
});
