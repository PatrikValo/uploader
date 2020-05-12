import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import mock from "xhr-mock";
import Config from "../../client/src/ts/config";
import DownloadFileSource from "../../client/src/ts/downloadFileSource";
import IReceiver from "../../client/src/ts/interfaces/iReceiver";
import {
    FileBiggerThanChunk,
    FileChunk,
    FileSmallerThanChunk
} from "./tmp/createFiles";
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

const range = jest.fn();
const rangeDbx = jest.fn();
let throwError = false;

jest.mock("../../client/src/ts/receiver", () => {
    return {
        ReceiverDropbox: class ReceiverDropbox implements IReceiver {
            public receive(from: number, to: number): Promise<Uint8Array> {
                rangeDbx(from, to);
                return Promise.resolve(new Uint8Array(to - from));
            }
        },
        ReceiverServer: class ReceiverServer implements IReceiver {
            public receive(from: number, to: number): Promise<Uint8Array> {
                range(from, to);
                if (!throwError) {
                    return Promise.resolve(new Uint8Array(to - from));
                } else {
                    return Promise.reject(new Error("Empty response"));
                }
            }
        }
    };
});

const { ivLength, saltLength, authTagLength } = Config.cipher;

describe("DownloadFileSource tests", () => {
    describe("DownloadFileSource File Smaller Than Chunk", () => {
        test("It sends correct requests", async () => {
            range.mockReset();
            const file = new FileSmallerThanChunk();
            const metadata = await file.encryptedMetadataWithLength();
            const startFrom = ivLength + 1 + saltLength + metadata.length;
            const size = startFrom + file.getFile().size + authTagLength;
            const down = new DownloadFileSource(
                "ID",
                "server",
                startFrom,
                size
            );
            let res = down.downloadChunk();
            await expect(res).resolves.not.toBeNull();
            await expect(res).resolves.toEqual(
                expect.objectContaining({ last: true })
            );

            expect(range.mock.calls.length).toBe(1);
            expect(range.mock.calls[0][0]).toBe(startFrom);
            expect(range.mock.calls[0][1]).toBe(size);

            res = down.downloadChunk();
            await expect(res).resolves.toBeNull();
        });
    });

    describe("DownloadFileSource File Same As Chunk", () => {
        test("It sends correct requests", async () => {
            range.mockReset();
            const file = new FileChunk();
            const metadata = await file.encryptedMetadataWithLength();
            const startFrom = ivLength + 1 + saltLength + metadata.length;
            const size = startFrom + file.getFile().size + authTagLength;
            const down = new DownloadFileSource(
                "ID",
                "server",
                startFrom,
                size
            );
            let res = down.downloadChunk();
            await expect(res).resolves.not.toBeNull();
            await expect(res).resolves.toEqual(
                expect.objectContaining({ last: false })
            );

            expect(range.mock.calls.length).toBe(1);
            expect(range.mock.calls[0][0]).toBe(startFrom);
            expect(range.mock.calls[0][1]).toBe(size - authTagLength);

            res = down.downloadChunk();
            await expect(res).resolves.not.toBeNull();
            await expect(res).resolves.toEqual(
                expect.objectContaining({ last: true })
            );

            expect(range.mock.calls.length).toBe(2);
            expect(range.mock.calls[1][0]).toBe(size - authTagLength);
            expect(range.mock.calls[1][1]).toBe(size);

            res = down.downloadChunk();
            await expect(res).resolves.toBeNull();
        });
    });

    describe("DownloadFileSource File Bigger Than Chunk", () => {
        test("It sends correct requests", async () => {
            rangeDbx.mockReset();
            const file = new FileBiggerThanChunk();

            const metadata = await file.encryptedMetadataWithLength();
            const startFrom = ivLength + 1 + saltLength + metadata.length;
            const size = startFrom + file.getFile().size + authTagLength;
            const down = new DownloadFileSource(
                "ID",
                "dropbox",
                startFrom,
                size
            );

            let res = down.downloadChunk();
            await expect(res).resolves.not.toBeNull();
            await expect(res).resolves.toEqual(
                expect.objectContaining({ last: false })
            );

            expect(rangeDbx.mock.calls.length).toBe(1);
            expect(rangeDbx.mock.calls[0][0]).toBe(startFrom);
            expect(rangeDbx.mock.calls[0][1]).toBe(
                startFrom + Config.client.chunkSize
            );

            res = down.downloadChunk();
            await expect(res).resolves.not.toBeNull();
            await expect(res).resolves.toEqual(
                expect.objectContaining({ last: false })
            );

            expect(rangeDbx.mock.calls.length).toBe(2);
            expect(rangeDbx.mock.calls[1][0]).toBe(
                startFrom + Config.client.chunkSize
            );
            expect(rangeDbx.mock.calls[1][1]).toBe(size - authTagLength);

            res = down.downloadChunk();
            await expect(res).resolves.not.toBeNull();
            await expect(res).resolves.toEqual(
                expect.objectContaining({ last: true })
            );

            expect(rangeDbx.mock.calls.length).toBe(3);
            expect(rangeDbx.mock.calls[2][0]).toBe(size - authTagLength);
            expect(rangeDbx.mock.calls[2][1]).toBe(size);

            res = down.downloadChunk();
            await expect(res).resolves.toBeNull();
        });
    });

    describe("UploadSourceFile with not corrrect receiver", () => {
        test("It should throw Error", () => {
            expect(() => {
                const a = new DownloadFileSource("ID", "bad" as any, 0, 25);
            }).toThrow();
        });
    });

    describe("UploadSourceFile with bad responses", () => {
        test("It should throw Error", async () => {
            range.mockReset();
            throwError = true;
            const a = new DownloadFileSource("ID", "server", 0, 25);
            const res = a.downloadChunk();
            await expect(res).rejects.toEqual(new Error("Empty response"));
            expect(range.mock.calls.length).toBe(1);
            expect(range.mock.calls[0][0]).toBe(0);
            expect(range.mock.calls[0][1]).toBe(25);
        });
    });
});
