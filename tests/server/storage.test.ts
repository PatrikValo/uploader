import fs from "fs";
import pathObj from "path";
import Config from "../../server/src/config";
import { Storage } from "../../server/src/storage";
const path = pathObj.join(__dirname, "files");

function createFile(name: string): Promise<boolean> {
    return new Promise(resolve => {
        const data = new Uint8Array(Buffer.from("TEST"));
        fs.writeFile(pathObj.join(path, name), data, err => {
            return resolve(!err);
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
});
