import fs from "fs";
import pathObj from "path";
import Config from "../../server/src/config";
const path = pathObj.join(__dirname, "files");
import FileSaver from "../../server/src/fileSaver";
import { Storage } from "../../server/src/storage";

const iv: number[] = [];
for (let i = 0; i < 32; i++) {
    iv.push(i);
}
const flags: number[] = [1];
const salt: number[] = [];
for (let i = 65; i < 32 + 65; i++) {
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
        await file.saveChunk(Buffer.from(iv));
        await file.saveChunk(Buffer.from(flags));
        await file.saveChunk(Buffer.from(salt));
        await file.saveChunk(Buffer.from(sizeMet));
        await file.saveChunk(Buffer.from(metadata));
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
        await file.saveChunk(Buffer.from(iv));
        await file.clear();
        const storage = new Storage(path);
        const exist = storage.exist("newFileCreator2");
        expect(exist).toBe(false);
    });
});
