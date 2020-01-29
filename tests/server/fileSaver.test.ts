import fs from "fs";
import pathObj from "path";
import Config from "../../server/src/config";
const path = pathObj.join(__dirname, "files");
import FileSaver from "../../server/src/fileSaver";
import { Storage } from "../../server/src/storage";

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
const sizeMet = [0, 6];
const firstChunk: number[] = [];
for (let i = 0; i < Config.chunkSize; i++) {
    firstChunk.push(15);
}

const secondChunk: number[] = [251, 200, 198, 1, 2, 65, 0, 66];

const buff = Buffer.from(
    iv.concat(flags, salt, sizeMet, metadata, firstChunk, secondChunk)
);
describe("FileSaver tests", () => {
    test("It should create valid file", async () => {
        const file = new FileSaver("newFileCreator", path);
        await file.saveInitializationVector(Buffer.from(iv));
        await file.saveFlags(Buffer.from(flags));
        await file.saveSalt(Buffer.from(salt));
        await file.saveMetadata(Buffer.from(metadata));
        await file.saveChunk(Buffer.from(firstChunk));
        await file.saveChunk(Buffer.from(secondChunk));
        await file.end();
        const result = fs.readFileSync(pathObj.join(path, "newFileCreator"));
        expect(result.length).toBe(buff.length);
        expect(buff).toStrictEqual(result);
        const storage = new Storage(path);
        await storage.remove("newFileCreator");
    });

    test("It should clear file", async () => {
        const file = new FileSaver("newFileCreator2", path);
        await file.saveInitializationVector(Buffer.from(iv));
        await file.clear();
        const storage = new Storage(path);
        const exist = storage.exist("newFileCreator2");
        expect(exist).toBe(false);
    });

    test("It should throw error each time, when we try save too short or too big data", async () => {
        const file = new FileSaver("newFileCreator", path);
        let error = file.saveInitializationVector(Buffer.from([1]));
        await expect(error).rejects.not.toBeNull();
        error = file.saveFlags(Buffer.from([]));
        await expect(error).rejects.not.toBeNull();
        error = file.saveSalt(Buffer.from([2]));
        await expect(error).rejects.not.toBeNull();
        error = file.saveMetadata(Buffer.alloc(70000));
        await expect(error).rejects.not.toBeNull();
        await file.end();
        const storage = new Storage(path);
        await storage.remove("newFileCreator");
    });
});
