import WS from "jest-websocket-mock";
import Config from "../../client/src/ts/config";
import Metadata from "../../client/src/ts/metadata";
import UploadFile from "../../client/src/ts/uploadFile";
import Utils from "../../client/src/ts/utils";

jest.mock("../../client/src/ts/cipher", () => {
    return class {
        public async exportedKey(): Promise<string> {
            return new Promise(resolve => {
                resolve("key");
            });
        }

        public initializationVector(): Uint8Array {
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

        public async encryptMetadata(metadata: Metadata): Promise<Uint8Array> {
            const metadataArray: Uint8Array = metadata.toUint8Array();
            return await this.encryptChunk(metadataArray);
        }

        public async decryptMetadata(metadata: Uint8Array): Promise<Metadata> {
            const decryptMetadata = await this.decryptChunk(metadata);
            return new Metadata(decryptMetadata);
        }

        public async encryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
            return new Promise(resolve => {
                resolve(chunk);
            });
        }

        public async decryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
            return new Promise(resolve => {
                resolve(chunk);
            });
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

    test("It should send correct IV to server and throw Exception after closed connection", async () => {
        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("iv")
        );
        const server = new WS(Utils.server.websocketUrl("iv"));

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

    test("It should send correct Metadata to server and throw Exception after closed connection", async () => {
        const metadataUint = new Uint8Array([1, 2, 125]);

        const encoder = () => ({
            encode: jest.fn().mockReturnValue(metadataUint)
        });

        (window as any).TextEncoder = jest.fn().mockImplementation(encoder);

        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("metadata")
        );
        const server = new WS(Utils.server.websocketUrl("metadata"));

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
        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("data")
        );
        const server = new WS(Utils.server.websocketUrl("data"));

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
        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("badStatus")
        );
        const server = new WS(Utils.server.websocketUrl("badStatus"));

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

    test("It should return correct key and ID", async () => {
        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("correctResult")
        );
        const server = new WS(Utils.server.websocketUrl("correctResult"));

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

    test("It should return empty key and ID after stop uploading", async () => {
        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("stop")
        );
        const server = new WS(Utils.server.websocketUrl("stop"));

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
        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("incorrect")
        );
        const server = new WS(Utils.server.websocketUrl("incorrect"));

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
        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("nextElement")
        );
        const server = new WS(Utils.server.websocketUrl("nextElement"));

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
        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("onerror")
        );
        const server = new WS(Utils.server.websocketUrl("onerror"));

        const serverPromise = server.connected;
        const mockProgress = jest.fn();
        const resultPromise = uploadFile.upload(mockProgress);

        await serverPromise;

        server.error();

        await expect(resultPromise).rejects.not.toBeNull();
        expect(mockProgress).not.toBeCalled();
    });

    test("It should throw Exception because progress function throws Error", async () => {
        const uploadFile = new UploadFile(
            file,
            Utils.server.websocketUrl("onerror")
        );
        const server = new WS(Utils.server.websocketUrl("onerror"));

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
