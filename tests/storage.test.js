const FileReader = require("../server/fileReader");
const FileSaver = require("../server/fileSaver");
const Storage = require("../server/storage");
const pathObj = require("path");
const path = pathObj.join(__dirname, "files");
const fs = require("fs");

describe("Storage", () => {
    describe("constructor", () => {
        test("It should create object correctly", () => {
            let storage = new Storage(path);
            expect(storage).toEqual({ path: path });
        });
        test("It should create object correctly", () => {
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
            let storage = new Storage(path);
            const result = storage.exist("16bytesHeader");
            expect(result).toBe(true);
        });
        test("It should return true, because file doesn't exist", () => {
            let storage = new Storage(path);
            const result = storage.exist("16bytesheader");
            expect(result).toBe(false);
        });
    });

    describe("read", () => {
        test("It should return Buffer, which contains values 0-15", async () => {
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
        test("It should return correct readableStream", () => {
            let storage = new Storage(path);
            const readableStream = storage.readableStream("16bytesHeader");
            readableStream.on("data", result => {
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
                expect(result).toEqual(expected);
            });
        });
        test("It should return part of original file", () => {
            let storage = new Storage(path);
            const readableStream = storage.readableStream(
                "16bytesHeader",
                18,
                18 + 4
            );
            readableStream.on("data", result => {
                const expected = Buffer.from([0, 1, 2, 3, 4]);
                expect(result).toEqual(expected);
            });
        });
    });
});

describe("FileReader", () => {
    const correctID = "16bytesHeader";
    const incorrectID = "123456";

    describe("constructor", () => {
        test("It should create object correctly", () => {
            let fileReader = new FileReader(correctID, path);
            expect(fileReader).toMatchObject({ id: correctID });
        });
        test("It should throw exception", () => {
            expect(() => {
                new FileReader(incorrectID, path);
            }).toThrow();
        });
    });

    describe("initializationVector", () => {
        test("It should return Buffer, which contains 0-15 values", async () => {
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
    });

    describe("metadata", () => {
        test("It should return Buffer, which contains 0-4 values", async () => {
            let fileReader = new FileReader(correctID, path);
            let expected = Buffer.from([0, 1, 2, 3, 4]);
            let m = await fileReader.metadata();
            expect(m).toEqual(expected);
        });
    });

    describe("file", () => {
        test("It should return whole file without headers", () => {
            let fileReader = new FileReader(correctID, path);
            let expected = Buffer.from([254, 128, 13, 0, 1, 0]);
            fileReader.readableStream().then(r => {
                r.on("data", re => {
                    expect(re).toEqual(expected);
                });
            });
        });
    });
});

describe("FileSaver", () => {
    describe("saveInitializationVector", () => {
        test("It should save to file iv", () => {
            let fileSaver = new FileSaver("iv12324iv", path);
            const buffer = Buffer.from([
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
            fileSaver.saveInitializationVector(buffer);
            let storage = new Storage(path);
            expect(storage.exist("iv12324iv")).toBe(true);
            fs.unlink(pathObj.join(path, "iv12324iv"), _e => {});
        });
    });
});
