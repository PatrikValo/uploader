import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import mock from "xhr-mock";
import Config from "../../client/src/ts/config";
import DownloadMetadataSource from "../../client/src/ts/downloadMetadataSource";
import IReceiver from "../../client/src/ts/interfaces/iReceiver";
import { FileSmallerThanChunk } from "./tmp/createFiles";
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

jest.mock("../../client/src/ts/receiver", () => {
    return {
        ReceiverDropbox: class ReceiverDropbox implements IReceiver {
            public receive(from: number, to: number): Promise<Uint8Array> {
                rangeDbx(from, to);
                return Promise.reject(new Error("Undefined"));
            }
        },
        ReceiverServer: class ReceiverServer implements IReceiver {
            public async receive(
                from: number,
                to: number
            ): Promise<Uint8Array> {
                range(from, to);
                const file = new FileSmallerThanChunk();
                const add = await file.additionalData(false);
                const metadata = await file.encryptedMetadataWithLength();
                const result = new Uint8Array(add.length + metadata.length);
                result.set(add);
                result.set(metadata, add.length);

                return Promise.resolve(result.slice(from, to));
            }
        }
    };
});
const { ivLength, saltLength } = Config.cipher;
describe("DownloadMetadataSource tests", () => {
    test("It should download correct data", async () => {
        range.mockReset();
        const file = new FileSmallerThanChunk();
        const download = new DownloadMetadataSource("ID", "server");

        const res = download.downloadAdditionalData();
        await expect(res).resolves.toEqual(
            await file.completeAdditionalData(false)
        );

        const end = ivLength + 1 + saltLength + 2;
        expect(range.mock.calls.length).toBe(1);
        expect(range.mock.calls[0][0]).toBe(0);
        expect(range.mock.calls[0][1]).toBe(end);

        const metadata = download.downloadMetadata(63);
        await expect(metadata).resolves.toStrictEqual(
            await file.encryptedMetadata()
        );
        expect(range.mock.calls.length).toBe(2);
        expect(range.mock.calls[1][0]).toBe(end);
        expect(range.mock.calls[1][1]).toBe(end + 63);
    });

    test("It should throw error, because server is not available", async () => {
        range.mockReset();
        const download = new DownloadMetadataSource("ID", "dropbox");

        const res = download.downloadAdditionalData();
        await expect(res).rejects.toEqual(new Error("Undefined"));

        const end = ivLength + 1 + saltLength + 2;
        expect(rangeDbx.mock.calls.length).toBe(1);
        expect(rangeDbx.mock.calls[0][0]).toBe(0);
        expect(rangeDbx.mock.calls[0][1]).toBe(end);
    });

    test("It should throw error, because receiver doesn't exist", async () => {
        expect(() => {
            const download = new DownloadMetadataSource("ID", "bad" as any);
        }).toThrow();
    });
});
