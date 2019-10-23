const FileReader = require("../server/fileReader");
const FileSaver = require("../server/fileSaver");
const Storage = require("../server/storage");
const pathObj = require("path");
const path = pathObj.join(__dirname, "files");
const fs = require("fs");

function onData(readable) {
    return new Promise((resolve, _reject) => {
        readable.on("data", chunk => {
            return resolve(chunk);
        });
    });
}

function onFinish(writable) {
    return new Promise((resolve, _reject) => {
        writable.on("finish", () => {
            return resolve();
        });
    });
}
/*---------------STORAGE-TEST---------------*/
describe("Storage", () => {
    describe("constructor", () => {
        test("It should create object correctly", () => {
            expect.assertions(1);
            let storage = new Storage(path);
            expect(storage).toEqual({ path: path });
        });
        test("It should create object correctly", () => {
            expect.assertions(1);
            let storage = new Storage();
            let pathSplit = __dirname.split(pathObj.sep);
            pathSplit.pop();
            pathSplit.push("server");
            pathSplit.push("files");
            let expectedPath = "/";
            pathSplit.forEach(value => {
                expectedPath = pathObj.join(expectedPath, value);
            });
            expect(storage).toEqual({ path: expectedPath });
        });
    });

    describe("exist", () => {
        test("It should return true, because file exists", () => {
            expect.assertions(1);
            let storage = new Storage(path);
            const result = storage.exist("16bytesHeader");
            expect(result).toBe(true);
        });
        test("It should return true, because file doesn't exist", () => {
            expect.assertions(1);
            let storage = new Storage(path);
            const result = storage.exist("16bytesheader");
            expect(result).toBe(false);
        });
    });

    describe("read", () => {
        test("It should return Buffer, which contains values 0-15", async () => {
            expect.assertions(1);
            let storage = new Storage(path);
            const fd = storage.open("16bytesHeader");
            const expected = Buffer.from([
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15
            ]);
            const r = await storage.read(fd, 0, 15);
            expect(r).toEqual(expected);
            storage.close(fd);
        });
        test("It should return Buffer, which contains 0,5,0-4,254,128,13, 0, 1, 0", async () => {
            expect.assertions(1);
            let storage = new Storage(path);
            const fd = storage.open("16bytesHeader");
            const expected = Buffer.from([
                0,
                5,
                0,
                1,
                2,
                3,
                4,
                254,
                128,
                13,
                0,
                1,
                0
            ]);
            const r = await storage.read(fd, 16, 28);
            expect(r).toEqual(expected);
            storage.close(fd);
        });
    });
    describe("readableStream", () => {
        test("It should return correct readableStream", async () => {
            expect.assertions(1);
            let storage = new Storage(path);
            const readableStream = storage.readableStream("16bytesHeader");
            const expected = Buffer.from([
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                0,
                5,
                0,
                1,
                2,
                3,
                4,
                254,
                128,
                13,
                0,
                1,
                0
            ]);
            const result = await onData(readableStream);
            expect(result).toEqual(expected);
        });
        test("It should return part of original file", async () => {
            expect.assertions(1);
            let storage = new Storage(path);
            const readableStream = storage.readableStream(
                "16bytesHeader",
                18,
                18 + 4
            );
            const expected = Buffer.from([0, 1, 2, 3, 4]);
            const result = await onData(readableStream);
            expect(result).toEqual(expected);
        });
    });
});

/*---------------FILEREADER-TEST---------------*/
describe("FileReader", () => {
    const correctID = "16bytesHeader";
    const incorrectID = "123456";

    describe("constructor", () => {
        test("It should create object correctly", () => {
            expect.assertions(1);
            let fileReader = new FileReader(correctID, path);
            expect(fileReader).toMatchObject({ id: correctID });
        });

        test("It should throw exception", () => {
            expect.assertions(1);
            expect(() => {
                new FileReader(incorrectID, path);
            }).toThrow();
        });
    });

    describe("initializationVector", () => {
        test("It should return Buffer, which contains 0-15 values", async () => {
            expect.assertions(1);
            let fileReader = new FileReader(correctID, path);
            let expected = Buffer.from([
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15
            ]);
            let iv = await fileReader.initializationVector();
            expect(iv).toEqual(expected);
        });

        test("It should return correct Buffer, although there isn't metadata", async () => {
            expect.assertions(1);
            let fileReader = new FileReader("tooShortMetadata", path);
            let expected = Buffer.from([
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15
            ]);
            let iv = await fileReader.initializationVector();
            expect(iv).toEqual(expected);
        });

        test("It should throw exception, because IV is too short", async () => {
            expect.assertions(2);
            let fileReader = new FileReader("tooShortIv", path);
            const notCalled = jest.fn();
            const called = jest.fn();
            try {
                let result = await fileReader.initializationVector();
                notCalled();
            } catch (e) {
                called(e);
            }
            expect(notCalled).not.toHaveBeenCalled();
            expect(called).toHaveBeenCalledWith(
                "File doesn't have correct size"
            );
        });
    });

    describe("metadata", () => {
        test("It should return Buffer, which contains 0-4 values", async () => {
            expect.assertions(1);
            let fileReader = new FileReader(correctID, path);
            let expected = Buffer.from([0, 1, 2, 3, 4]);
            let m = await fileReader.metadata();
            expect(m).toEqual(expected);
        });

        test("It should find length, but there isn't metadata", async () => {
            expect.assertions(2);
            let fileReader = new FileReader("tooShortMetadata", path);
            const notCalled = jest.fn();
            const called = jest.fn();
            try {
                let result = await fileReader.metadata();
                notCalled();
            } catch (e) {
                called(e);
            }
            expect(notCalled).not.toHaveBeenCalled();
            expect(called).toHaveBeenCalledWith(
                "File doesn't have correct size"
            );
        });

        test("It should throw exception, because there isn't any information", async () => {
            expect.assertions(2);
            let fileReader = new FileReader("tooShortIv", path);
            const notCalled = jest.fn();
            const called = jest.fn();
            try {
                let result = await fileReader.metadata();
                notCalled();
            } catch (e) {
                called(e);
            }
            expect(notCalled).not.toHaveBeenCalled();
            expect(called).toHaveBeenCalledWith(
                "File doesn't have correct size"
            );
        });
    });

    describe("file", () => {
        test("It should return whole file without headers", async () => {
            expect.assertions(1);
            let fileReader = new FileReader(correctID, path);
            let expected = Buffer.from([254, 128, 13, 0, 1, 0]);
            let readableStream = await fileReader.readableStream();
            const result = await onData(readableStream);
            expect(result).toEqual(expected);
        });
    });
});

/*---------------FILESAVER-TEST---------------*/
describe("FileSaver", () => {
    describe("saveWholeFile", () => {
        test("It should save all to file correctly", async () => {
            expect.assertions(3);
            let fileSaver = new FileSaver("file1file", path);
            const iv = Buffer.from([
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                0,
                14,
                15
            ]);

            const metadata = Buffer.from([0, 1, 2, 3, 4]);

            const body = Buffer.from([254, 128, 13, 0, 1, 0]);

            fileSaver.saveInitializationVector(iv);
            fileSaver.saveMetadata(metadata);
            fileSaver.saveChunk(body);
            fileSaver.end();
            await onFinish(fileSaver.stream);

            let fileReader = new FileReader("file1file", path);
            let ivResult = await fileReader.initializationVector();
            let metadataResult = await fileReader.metadata();
            let readableStream = await fileReader.readableStream();
            let bodyResult = await onData(readableStream);

            fs.unlink(pathObj.join(path, "file1file"), _e => {});
            expect(ivResult).toEqual(iv);
            expect(metadataResult).toEqual(metadata);
            expect(bodyResult).toEqual(body);
        });
    });
});
