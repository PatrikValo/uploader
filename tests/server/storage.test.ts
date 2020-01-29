import fs from "fs";
import pathObj from "path";
import Config from "../../server/src/config";
import { FileHandle, Storage } from "../../server/src/storage";
const path = pathObj.join(__dirname, "files");

function createFile(name: string): Promise<boolean> {
    return new Promise(resolve => {
        const data = new Uint8Array(Buffer.from("TEST"));
        fs.writeFile(pathObj.join(path, name), data, err => {
            return resolve(!err);
        });
    });
}

function getContent(name: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        fs.readFile(pathObj.join(path, name), (err, data) => {
            if (err) {
                return reject(err);
            }

            return resolve(data);
        });
    });
}

describe("Storage tests", () => {
    describe("Storage test", () => {
        describe("Constructor", () => {
            test("It should create valid object with custom path", () => {
                const storage = new Storage(path);
                expect((storage as any).path).toEqual(path);
            });

            test("It should create valid object with config path", () => {
                const storage = new Storage();
                expect((storage as any).path).toEqual(Config.spacePath);
            });
        });

        describe("Open", () => {
            test("It should open file correctly", async () => {
                const storage = new Storage(path);
                const fileHandle = storage.open("exist");
                await expect(fileHandle).resolves.not.toBeNull();
                const file = await fileHandle;
                await file.close();
            });

            test("It should open file with error, because file doesn't exist", async () => {
                const storage = new Storage(path);
                const fileHandle = storage.open("nOtExIsT");
                await expect(fileHandle).rejects.not.toBeNull();
            });
        });

        describe("Exist", () => {
            test("It should return true, because file exists", () => {
                const storage = new Storage(path);
                const result = storage.exist("exist");
                expect(result).toBe(true);
            });

            test("It should return false, because file doesn't exist", () => {
                const storage = new Storage(path);
                const result = storage.exist("abc.ts");
                expect(result).toBe(false);
            });
        });

        describe("Remove", () => {
            test("It should remove file correctly", async () => {
                await createFile("createTmpFileAndRemoveIt.txt");
                const storage = new Storage(path);
                const beforeExist = storage.exist(
                    "createTmpFileAndRemoveIt.txt"
                );
                expect(beforeExist).toBe(true);
                const result = storage.remove("createTmpFileAndRemoveIt.txt");
                await expect(result).resolves.toBe(true);
                const afterExist = storage.exist(
                    "createTmpFileAndRemoveIt.txt"
                );
                expect(afterExist).toBe(false);
            });

            test("It should throw exception, because file not exist", async () => {
                const storage = new Storage(path);
                const result = storage.remove("abcde");
                await expect(result).rejects.not.toBeNull();
            });
        });
    });

    describe("FileHandle test", () => {
        describe("Read", () => {
            const storage = new Storage(path);
            const buff = Buffer.from(
                "This text is only for test purpose. AaBbCcDd\n" + "This text"
            );

            test("It should read correctly", async () => {
                const file = await storage.open("createWritable.txt");
                expect.assertions(buff.length);
                for (let i = 0; i < buff.length; i++) {
                    const result = file.read(i, i);
                    await expect(result).resolves.toStrictEqual(
                        buff.slice(i, i + 1)
                    );
                }
                await file.close();
            });

            test("It should read throw error because there is negative index", async () => {
                const file = await storage.open("createWritable.txt");
                const result = file.read(0, -5);
                await expect(result).rejects.toEqual(
                    new Error("Negative parameter")
                );
                await file.close();
            });

            test("It should read throw error because read more than file size", async () => {
                const file = await storage.open("createWritable.txt");
                const result = file.read(0, buff.length);
                await expect(result).rejects.toEqual(
                    new Error("File doesn't have correct size")
                );
                await file.close();
            });

            test("It should error, because read from close file", async () => {
                const file = await storage.open("createWritable.txt");
                await file.close();
                const read = file.read(0, 1);
                await expect(read).rejects.toEqual(
                    new Error("File is already closed")
                );
            });
        });

        describe("ReadChunk", () => {
            const storage = new Storage(path);
            const buff = Buffer.from(
                "This text is only for test purpose. AaBbCcDd\n" + "This text"
            );

            test("It should read chunks correctly", async () => {
                const file = await storage.open("createWritable.txt");
                const result = file.readChunk(0, 0);
                await expect(result).resolves.toStrictEqual(buff);
                let shouldBeEmpty = file.readChunk(1, 0);
                await expect(shouldBeEmpty).resolves.toStrictEqual(
                    Buffer.from([])
                );
                shouldBeEmpty = file.readChunk(555, 0);
                await expect(shouldBeEmpty).resolves.toStrictEqual(
                    Buffer.from([])
                );
                await file.close();
            });

            test("It should read chunks correctly from start", async () => {
                const file = await storage.open("createWritable.txt");
                const result = file.readChunk(0, 5);
                await expect(result).resolves.toStrictEqual(buff.slice(5));
                let shouldBeEmpty = file.readChunk(1, 5);
                await expect(shouldBeEmpty).resolves.toStrictEqual(
                    Buffer.from([])
                );
                shouldBeEmpty = file.readChunk(555, 5);
                await expect(shouldBeEmpty).resolves.toStrictEqual(
                    Buffer.from([])
                );
                await file.close();
            });

            test("It should throw error because chunk number is negative index", async () => {
                const file = await storage.open("createWritable.txt");
                let result = file.readChunk(-1, Config.chunkSize);
                await expect(result).rejects.toEqual(
                    new Error("Negative parameter")
                );
                result = file.readChunk(1, -Config.chunkSize);
                await expect(result).rejects.toEqual(
                    new Error("Negative parameter")
                );
                await file.close();
            });

            test("It should error, because read chunk from close file", async () => {
                const file = await storage.open("createWritable.txt");
                await file.close();
                const read = file.readChunk(0, 0);
                await expect(read).rejects.toEqual(
                    new Error("File is already closed")
                );
            });
        });

        describe("Close", () => {
            test("It should close file correctly", async () => {
                const storage = new Storage(path);
                const file = await storage.open("exist");
                await expect(file.close()).resolves.not.toBeNull();
            });

            test("It should return error, because fd is not correct", async () => {
                const file = new FileHandle(2.5);
                await expect(file.close()).rejects.not.toBeNull();
            });

            test("It should close file correctly", async () => {
                const storage = new Storage(path);
                const file = await storage.open("exist");
                await expect(file.close()).resolves.not.toBeNull();
                await expect(file.close()).resolves.not.toBeNull();
                await expect(file.close()).resolves.not.toBeNull();
            });
        });
    });
});
