import WS from "jest-websocket-mock";
import Config from "../../client/src/ts/config";
import Metadata from "../../client/src/ts/metadata";
import UploadFile from "../../client/src/ts/uploadFile";
import Utils from "../../client/src/ts/utils";

async function exportedKey(): Promise<string> {
    return new Promise(resolve => {
        resolve("key");
    });
}

function initializationVector(): Uint8Array {
    return new Uint8Array([
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
        16
    ]);
}

async function encryptMetadata(metadata: Metadata): Promise<Uint8Array> {
    const metadataArray: Uint8Array = metadata.toUint8Array();
    return await encryptChunk(metadataArray);
}

async function decryptMetadata(metadata: Uint8Array): Promise<Metadata> {
    const decryptedMetadata = await decryptChunk(metadata);
    return new Metadata(decryptedMetadata);
}

async function encryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
    return new Promise(resolve => {
        resolve(chunk);
    });
}

async function decryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
    return new Promise(resolve => {
        resolve(chunk);
    });
}

jest.mock("../../client/src/ts/cipher", () => {
    return {
        ClassicCipher: class {
            public getSalt(): Uint8Array {
                return new Uint8Array(16);
            }

            public async exportedKey(): Promise<string> {
                return exportedKey();
            }

            public initializationVector(): Uint8Array {
                return initializationVector();
            }

            public async encryptMetadata(
                metadata: Metadata
            ): Promise<Uint8Array> {
                return encryptMetadata(metadata);
            }

            public async decryptMetadata(
                metadata: Uint8Array
            ): Promise<Metadata> {
                return decryptMetadata(metadata);
            }

            public async encryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
                return encryptChunk(chunk);
            }

            public async decryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
                return decryptChunk(chunk);
            }
        },
        PasswordCipher: class {
            public getSalt(): Uint8Array {
                return new Uint8Array([
                    0,
                    15,
                    1,
                    14,
                    2,
                    13,
                    3,
                    12,
                    4,
                    11,
                    5,
                    10,
                    6,
                    9,
                    7,
                    8
                ]);
            }

            public async exportedKey(): Promise<string> {
                return exportedKey();
            }

            public initializationVector(): Uint8Array {
                return initializationVector();
            }

            public async encryptMetadata(
                metadata: Metadata
            ): Promise<Uint8Array> {
                return encryptMetadata(metadata);
            }

            public async decryptMetadata(
                metadata: Uint8Array
            ): Promise<Metadata> {
                return decryptMetadata(metadata);
            }

            public async encryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
                return encryptChunk(chunk);
            }

            public async decryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
                return decryptChunk(chunk);
            }
        }
    };
});

describe("UploadFile tests", () => {
    const firstChunk = [125];
    for (let i = 0; i < Config.client.chunkSize - 18; i++) {
        firstChunk.push(8);
    }
    firstChunk.push(125);

    const secondChunk = [1, 2, 3, 4, 5, 6, 7, 8];
    const concat = new Uint8Array(firstChunk.concat(secondChunk));
    const blob = new Blob([], { type: "application/javascript" });
    const file = new File([blob, concat], "test.js");

    afterEach(() => {
        WS.clean();
    });

    test("It should send correct IV to server and throw Exception after closed connection", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);
        await serverPromise;

        server.send(JSON.stringify({ nextElement: "iv" }));
        await expect(server).toReceiveMessage(
            new Uint8Array([
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
                16
            ])
        );

        server.close();

        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );

        expect(mockProgress).not.toBeCalled();
    });

    test("It should send correct Flags without password to server and throw Exception after closed connection", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);
        await serverPromise;

        server.send(JSON.stringify({ nextElement: "flags" }));
        await expect(server).toReceiveMessage(new Uint8Array(1));

        server.close();

        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );

        expect(mockProgress).not.toBeCalled();
    });

    test("It should send correct Flags with password to server and throw Exception after closed connection", async () => {
        const uploadFile = new UploadFile(file, "aaa");
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);
        await serverPromise;

        server.send(JSON.stringify({ nextElement: "flags" }));
        await expect(server).toReceiveMessage(new Uint8Array([1]));

        server.close();

        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );

        expect(mockProgress).not.toBeCalled();
    });

    test("It should send correct Salt without password to server and throw Exception after closed connection", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);
        await serverPromise;

        server.send(JSON.stringify({ nextElement: "salt" }));
        await expect(server).toReceiveMessage(new Uint8Array(16));

        server.close();

        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );

        expect(mockProgress).not.toBeCalled();
    });

    test("It should send correct Salt with password to server and throw Exception after closed connection", async () => {
        const uploadFile = new UploadFile(file, "ahoj");
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);
        await serverPromise;

        server.send(JSON.stringify({ nextElement: "salt" }));
        await expect(server).toReceiveMessage(
            new Uint8Array([
                0,
                15,
                1,
                14,
                2,
                13,
                3,
                12,
                4,
                11,
                5,
                10,
                6,
                9,
                7,
                8
            ])
        );

        server.close();

        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );

        expect(mockProgress).not.toBeCalled();
    });

    test("It should send correct Metadata to server and throw Exception after closed connection", async () => {
        const metadataUint = new Uint8Array([1, 2, 125]);

        const encoder = () => ({
            encode: jest.fn().mockReturnValue(metadataUint)
        });

        (window as any).TextEncoder = jest.fn().mockImplementation(encoder);

        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.send(JSON.stringify({ nextElement: "metadata" }));
        await expect(server).toReceiveMessage(metadataUint);
        expect(TextEncoder).toBeCalled();

        server.close();

        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );
        expect(mockProgress).not.toBeCalled();
    });

    test("It should send correct all data to server and throw Exception after closed connection", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.send(JSON.stringify({ status: 200 }));
        await expect(server).toReceiveMessage(new Uint8Array(firstChunk));
        expect(mockProgress.mock.calls[0][0]).toBe(firstChunk.length);

        server.send(JSON.stringify({ status: 200 }));
        await expect(server).toReceiveMessage(new Uint8Array(secondChunk));
        expect(mockProgress.mock.calls[1][0]).toBe(secondChunk.length);

        server.send(JSON.stringify({ status: 200 }));
        await expect(server).toReceiveMessage("null");
        expect(mockProgress.mock.calls[2][0]).toBe(0);

        server.close();
        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );

        expect(mockProgress.mock.calls.length).toBe(3);
    });

    test("It should throw Exception because server send bad status", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.send(JSON.stringify({ status: 500 }));

        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );
        expect(mockProgress).not.toBeCalled();
    });

    test("It should return correct key and ID without password", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.send(JSON.stringify({ id: "25-id-25" }));

        await expect(resultPromise).resolves.toEqual({
            id: "25-id-25",
            key: "key"
        });
        expect(mockProgress).not.toBeCalled();
    });

    test("It should return correct ID with password", async () => {
        const uploadFile = new UploadFile(file, "aa");
        const server = new WS(Utils.server.websocketUrl("/api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.send(JSON.stringify({ id: "25-id-25" }));

        await expect(resultPromise).resolves.toEqual({
            id: "25-id-25",
            key: ""
        });
        expect(mockProgress).not.toBeCalled();
    });

    test("It should return empty key and ID after stop uploading", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        uploadFile.cancel();
        server.send(JSON.stringify({ status: 200 }));

        await expect(resultPromise).resolves.toEqual({
            id: "",
            key: ""
        });

        expect(mockProgress).not.toBeCalled();
    });

    test("It should throw Exception because server send incorrect message", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("api/upload"));

        const mockProgress = jest.fn();
        const serverPromise = server.connected;
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.send(JSON.stringify({ incorrectMsg: 200 }));

        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );
        expect(mockProgress).not.toBeCalled();
    });

    test("It should throw Exception because server send incorrect nextElement", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.send(JSON.stringify({ nextElement: 200 }));

        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );
        expect(mockProgress).not.toBeCalled();
    });

    test("It should throw Exception because websocket.onerror", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.error();

        await expect(resultPromise).rejects.not.toBeNull();
        expect(mockProgress).not.toBeCalled();
    });

    test("It should throw Exception because progress function throws Error", async () => {
        const uploadFile = new UploadFile(file);
        const server = new WS(Utils.server.websocketUrl("api/upload"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn().mockImplementation((u: number) => {
            throw new Error("test" + u);
        });
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.send(JSON.stringify({ status: 200 }));
        await expect(resultPromise).rejects.toEqual(
            new Error("Websocket problem")
        );
        expect(mockProgress.mock.calls[0][0]).toBe(firstChunk.length);
    });
});
