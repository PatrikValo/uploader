import Config from "../../client/src/ts/config";
import FileStream from "../../client/src/ts/fileStream";

describe("FileStream tests", () => {
    describe("Read function", () => {
        test("it return correct not empty chunks", async () => {
            const firstChunk = [25];
            for (let i = 0; i < Config.client.chunkSize - 18; i++) {
                firstChunk.push(56);
            }
            firstChunk.push(25);

            const secondChunk = [1, 2, 3, 4, 5, 6, 7];
            const concat = new Uint8Array(firstChunk.concat(secondChunk));
            const blob = new Blob([], { type: "application/javascript" });
            const file = new File([blob, concat], "test.js");
            const fileStream = new FileStream(file);
            let result = await fileStream.read();
            expect(result.done).toBe(false);
            expect(result.value).toStrictEqual(new Uint8Array(firstChunk));
            result = await fileStream.read();
            expect(result.done).toBe(false);
            expect(result.value).toStrictEqual(new Uint8Array(secondChunk));
            result = await fileStream.read();
            expect(result.done).toBe(true);
            expect(result.value).toStrictEqual(new Uint8Array(0));
        });

        test("it return correct value for empty file", async () => {
            const firstChunk: number[] = [];
            const concat = new Uint8Array(firstChunk);
            const blob = new Blob([], { type: "application/javascript" });
            const file = new File([blob, concat], "test.js");
            const fileStream = new FileStream(file);
            const result = await fileStream.read();
            expect(result.done).toBe(true);
        });
    });
});
