import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import mock from "xhr-mock";
import UploadSource from "../../client/src/ts/uploadSource";
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

describe("UploadSource tests", () => {
    describe("UploadSource Without Password", () => {
        const file = new FileSmallerThanChunk();
        const uploadSource = new UploadSource(file.getFile());

        test("It should return correct values in correct order", async () => {
            expect.assertions(11);
            const progress = jest.fn();

            // additional data without length
            let result = uploadSource.getContent(progress);
            await expect(result).resolves.toStrictEqual(
                file.additionalData(false)
            );

            expect(progress.mock.calls.length).toBe(0);

            // encryptedMetadata with length
            result = uploadSource.getContent(progress);
            await expect(result).resolves.toStrictEqual(
                await file.encryptedMetadataWithLength()
            );

            expect(progress.mock.calls.length).toBe(0);

            const arr = await file.encryptFile();

            // first and also last chunk
            result = uploadSource.getContent(progress);
            await expect(result).resolves.toStrictEqual(arr[0]);

            expect(progress.mock.calls.length).toBe(1);
            expect(progress.mock.calls[0][0]).toBe(file.getFile().size);

            // authTag
            result = uploadSource.getContent(progress);
            await expect(result).resolves.toStrictEqual(arr[1]);

            expect(progress.mock.calls.length).toBe(1);

            // end
            result = uploadSource.getContent(progress);
            await expect(result).resolves.toBeNull();

            // key
            const correctKey = await file.exportKey();
            const key = uploadSource.exportKey();
            await expect(key).resolves.toEqual(correctKey);
        });
    });

    describe("UploadSource With Password", () => {
        const file = new FileSmallerThanChunk();
        const password = "heslo";
        const uploadSource = new UploadSource(file.getFile(), password);

        test("It should return correct values in correct order", async () => {
            expect.assertions(14);
            const progress = jest.fn();

            // additional data
            let result = uploadSource.getContent(progress);
            await expect(result).resolves.toStrictEqual(
                file.additionalData(true)
            );

            expect(progress.mock.calls.length).toBe(0);

            // encrypted metadata with length
            result = uploadSource.getContent(progress);
            await expect(result).resolves.toStrictEqual(
                await file.encryptedMetadataWithLength(password)
            );

            // encrypted metadata with key is different than metadata encrypted without key
            await expect(result).resolves.not.toStrictEqual(
                await file.encryptedMetadataWithLength()
            );

            expect(progress.mock.calls.length).toBe(0);

            // correct encrypted with password
            const arr = await file.encryptFile(password);

            // incorrect encrypted without password
            const arrBad = await file.encryptFile();

            // first and also last chunk
            result = uploadSource.getContent(progress);
            await expect(result).resolves.toStrictEqual(arr[0]);
            await expect(result).resolves.not.toStrictEqual(arrBad[0]);

            expect(progress.mock.calls.length).toBe(1);
            expect(progress.mock.calls[0][0]).toBe(file.getFile().size);

            // authTag
            result = uploadSource.getContent(progress);
            await expect(result).resolves.toStrictEqual(arr[1]);
            await expect(result).resolves.not.toStrictEqual(arrBad[1]);

            expect(progress.mock.calls.length).toBe(1);

            // end
            result = uploadSource.getContent(progress);
            await expect(result).resolves.toBeNull();

            // key
            const correctKey = await file.exportKey(password);
            const key = uploadSource.exportKey();
            await expect(key).resolves.toEqual(correctKey);
        });
    });
});
