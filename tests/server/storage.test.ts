import pathObj from "path";
import Config from "../../server/src/config";
import Storage from "../../server/src/storage";
const path = pathObj.join(__dirname, "files");

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
            const result = storage.exist("16bytesHeader");
            expect(result).toBe(true);
        });

        test("It should return false, because file doesn't exist", () => {
            const storage = new Storage(path);
            const result = storage.exist("abc.ts");
            expect(result).toBe(false);
        });
    });

    describe("Create", () => {
        test("It should create and remove file", async () => {
            expect.assertions(2);
            const storage = new Storage(path);
            const stream = storage.writableStream("newTestFile");
            const content = Buffer.from([0, 1, 2, 3, 4, 5, 6]);
            stream.write(content);
            stream.end();

            const result = storage.exist("newTestFile");
            expect(result).toBe(true);

            await storage.remove("newTestFile");
            const remove = storage.exist("newTestFile");
            expect(remove).toBe(false);
        });
    });

    describe("Remove", () => {
        test("It should throw exception, because file not exist", async () => {
            const storage = new Storage(path);
            const result = storage.remove("abcde");
            await expect(result).rejects.not.toBeNull();
        });
    });

    describe("Read", () => {
        test("It should open, read correct values and close correctly", async () => {
            const storage = new Storage(path);
            const content = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

            const fd = storage.open("readTestFile");

            const result = storage.read(fd, 0, 10);

            await expect(result).resolves.toEqual(content);

            storage.close(fd);
        });

        test("It should open, read correct values and close correctly from third position", async () => {
            const storage = new Storage(path);
            const content = Buffer.from([2, 3, 4, 5, 6, 7, 8]);

            const fd = storage.open("readTestFile");

            const result = storage.read(fd, 2, 8);

            await expect(result).resolves.toEqual(content);

            storage.close(fd);
        });

        test("It should throw exception, because request is longer than file", async () => {
            const storage = new Storage(path);

            const fd = storage.open("readTestFile");

            const result = storage.read(fd, 0, 10000);

            await expect(result).rejects.not.toBeNull();

            storage.close(fd);
        });

        test("It should throw exception, because fd is not correct", async () => {
            const storage = new Storage(path);

            const fd = -1;

            const result = storage.read(fd, 0, 10);

            await expect(result).rejects.not.toBeNull();
        });
    });

    describe("ReadChunk", () => {
        test("It should read correct values of first chunk", async () => {
            const storage = new Storage(path);
            const content = Buffer.alloc(Config.chunkSize);
            content.fill(25);

            const fd = storage.open("onlyOneChunkFile");

            const result = storage.readChunk(fd, 0, 0);

            await expect(result).resolves.toEqual(content);

            storage.close(fd);
        });

        test("It should return null because second chunk not exist", async () => {
            const storage = new Storage(path);

            const fd = storage.open("onlyOneChunkFile");

            const result = storage.readChunk(fd, 1, 0);

            await expect(result).resolves.toEqual(Buffer.from([]));

            storage.close(fd);
        });

        test("It should throw exception because not correct fd", async () => {
            const storage = new Storage(path);

            const result = storage.readChunk(-1, 1, 0);

            await expect(result).rejects.not.toBeNull();
        });
    });
});
