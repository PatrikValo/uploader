import pathObj from "path";
import Config from "../../server/src/config";
import FileReader from "../../server/src/fileReader";
const path = pathObj.join(__dirname, "files");

describe("FileReader tests", () => {
    describe("Constructor", () => {
        test("It should be created correctly", () => {
            const fc = () => {
                const fileReader = new FileReader("exist", path);
                fileReader.close();
            };
            expect(fc).not.toThrow();
        });

        test("It should throw exception because file doesn't exist", () => {
            const fc = () => {
                const fileReader = new FileReader("nOtExIsT", path);
                fileReader.close();
            };
            expect(fc).toThrow();
        });
    });

    describe("Reading file", () => {
        const iv: number[] = [];
        for (let i = 0; i < Config.ivSize; i++) {
            iv.push(i);
        }
        const flags: number[] = [1];
        const salt: number[] = [];
        for (let i = 65; i < Config.saltSize + 65; i++) {
            salt.push(i);
        }
        const metadata: number[] = [200, 100, 33, 24, 15, 98];
        const sizeMet = Buffer.alloc(2);
        sizeMet.writeUInt16BE(metadata.length, 0);
        const firstChunk: number[] = [];
        for (let i = 0; i < Config.chunkSize; i++) {
            firstChunk.push(15);
        }

        const secondChunk: number[] = [251, 200, 198, 1, 2, 65, 0, 66];

        describe("IV", () => {
            test("It should return correct IV", async () => {
                const file = new FileReader("correctFile", path);
                const result = file.initializationVector();
                await expect(result).resolves.toStrictEqual(Buffer.from(iv));
                await file.close();
            });

            test("It should throw error because file is too short", async () => {
                const file = new FileReader("exist", path);
                const result = file.initializationVector();
                await expect(result).rejects.not.toBeNull();
                await file.close();
            });
        });

        describe("Flags", () => {
            test("It should return correct flags", async () => {
                const file = new FileReader("correctFile", path);
                const result = file.flags();
                await expect(result).resolves.toStrictEqual(Buffer.from(flags));
                await file.close();
            });

            test("It should throw error because file is too short", async () => {
                const file = new FileReader("exist", path);
                const result = file.flags();
                await expect(result).rejects.not.toBeNull();
                await file.close();
            });
        });

        describe("Salt", () => {
            test("It should return correct salt", async () => {
                const file = new FileReader("correctFile", path);
                const result = file.salt();
                await expect(result).resolves.toStrictEqual(Buffer.from(salt));
                await file.close();
            });

            test("It should throw error because file is too short", async () => {
                const file = new FileReader("exist", path);
                const result = file.salt();
                await expect(result).rejects.not.toBeNull();
                await file.close();
            });
        });

        describe("Metadata", () => {
            test("It should return correct metadata", async () => {
                const file = new FileReader("correctFile", path);
                const result = file.metadata();
                await expect(result).resolves.toStrictEqual(
                    Buffer.from(metadata)
                );
                await file.close();
            });

            test("It should throw error because file is too short", async () => {
                const file = new FileReader("exist", path);
                const result = file.metadata();
                await expect(result).rejects.not.toBeNull();
                await file.close();
            });
        });

        describe("Chunk", () => {
            test("It should return correct first chunk", async () => {
                const file = new FileReader("correctFile", path);
                const result = file.chunk(0);
                await expect(result).resolves.toStrictEqual(
                    Buffer.from(firstChunk)
                );
                await file.close();
            });

            test("It should return correct second chunk", async () => {
                const file = new FileReader("correctFile", path);
                const result = file.chunk(1);
                await expect(result).resolves.toStrictEqual(
                    Buffer.from(secondChunk)
                );
                await file.close();
            });

            test("It should return correct empty chunk", async () => {
                const file = new FileReader("correctFile", path);
                const result = file.chunk(2);
                await expect(result).resolves.toStrictEqual(Buffer.from([]));
                await file.close();
            });

            test("It should throw error because file is too short", async () => {
                const file = new FileReader("exist", path);
                const result = file.chunk(0);
                await expect(result).rejects.not.toBeNull();
                await file.close();
            });
        });
    });

    describe("Close", () => {
        test("It should close file correctly", async () => {
            const fileReader = new FileReader("exist", path);
            await fileReader.close();
            const result = fileReader.salt();
            await expect(result).rejects.toEqual(
                new Error("File is already closed")
            );
        });
    });
});
