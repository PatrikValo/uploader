import WS from "jest-websocket-mock";
import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import Config from "../../client/src/ts/config";
import Metadata from "../../client/src/ts/metadata";
import { UploadFileServer } from "../../client/src/ts/uploadFile";
import Utils from "../../client/src/ts/utils";

(window as any).TextEncoder = Encoder;
(window as any).TextDecoder = Decoder;

async function exportedKey(): Promise<string> {
    return new Promise(resolve => {
        resolve("key");
    });
}
const iv: number[] = [];
for (let i = 1; i < Config.cipher.ivLength; i++) {
    iv.push(i);
}

function initializationVector(): Uint8Array {
    return new Uint8Array(iv);
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
                return new Uint8Array(Config.cipher.saltLength);
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
                return new Uint8Array(iv);
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
    const metadata: Uint8Array = new Metadata(file).toUint8Array();
    describe("UploadFileServer tests", () => {
        afterEach(() => {
            WS.clean();
        });

        test("It should return correct key and ID without password", async () => {
            expect.assertions(10);
            const uploadFile = new UploadFileServer(file);
            const server = new WS(Utils.serverWebsocketUrl("/api/upload"));

            const serverPromise = server.connected;
            const mockProgress = jest.fn();
            const resultPromise = uploadFile.upload(mockProgress);

            await serverPromise;

            // send IV
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(initializationVector());
            // send flag
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(new Uint8Array([0]));
            // send salt
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(
                new Uint8Array(Config.cipher.saltLength)
            );
            // send metadata + length
            server.send(JSON.stringify({ status: 200 }));
            const mtd = new Uint8Array(metadata.length + 2);
            mtd.set(new Uint8Array([0, metadata.length]));
            mtd.set(metadata, 2);
            await expect(server).toReceiveMessage(mtd);
            // send first chunk
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(new Uint8Array(firstChunk));
            expect(mockProgress.mock.calls[0][0]).toBe(firstChunk.length);
            // send second chunk
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(new Uint8Array(secondChunk));
            expect(mockProgress.mock.calls[1][0]).toBe(secondChunk.length);
            // send null
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage("null");
            // receive ID
            server.send(JSON.stringify({ id: "25id25" }));

            await expect(resultPromise).resolves.toEqual({
                id: "25id25",
                key: "key"
            });
        });

        test("It should return correct ID with password", async () => {
            const uploadFile = new UploadFileServer(file, "aa");
            const server = new WS(Utils.serverWebsocketUrl("/api/upload"));

            const serverPromise = server.connected;
            const mockProgress = jest.fn();
            const resultPromise = uploadFile.upload(mockProgress);

            await serverPromise;

            // send IV
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(initializationVector());
            // send flag
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(new Uint8Array([1]));
            // send salt
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(new Uint8Array(iv));
            // send metadata + length
            server.send(JSON.stringify({ status: 200 }));
            const mtd = new Uint8Array(metadata.length + 2);
            mtd.set(new Uint8Array([0, metadata.length]));
            mtd.set(metadata, 2);
            await expect(server).toReceiveMessage(mtd);
            // send first chunk
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(new Uint8Array(firstChunk));
            expect(mockProgress.mock.calls[0][0]).toBe(firstChunk.length);
            // send second chunk
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(new Uint8Array(secondChunk));
            expect(mockProgress.mock.calls[1][0]).toBe(secondChunk.length);
            // send null
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage("null");
            // receive ID
            server.send(JSON.stringify({ id: "2id5" }));

            await expect(resultPromise).resolves.toEqual({
                id: "2id5",
                key: ""
            });
        });

        test("It should return empty key and ID after stop uploading", async () => {
            const uploadFile = new UploadFileServer(file);
            const server = new WS(Utils.serverWebsocketUrl("api/upload"));

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

        test("It should upload IV but throw exception after closed connection", async () => {
            const uploadFile = new UploadFileServer(file);
            const server = new WS(Utils.serverWebsocketUrl("/api/upload"));

            const serverPromise = server.connected;
            const mockProgress = jest.fn();
            const resultPromise = uploadFile.upload(mockProgress);

            await serverPromise;

            // send IV
            server.send(JSON.stringify({ status: 200 }));
            await expect(server).toReceiveMessage(initializationVector());
            server.close();

            await expect(resultPromise).rejects.not.toBeNull();
        });

        test("It should throw exception because bad server status", async () => {
            const uploadFile = new UploadFileServer(file);
            const server = new WS(Utils.serverWebsocketUrl("/api/upload"));

            const serverPromise = server.connected;
            const mockProgress = jest.fn();
            const resultPromise = uploadFile.upload(mockProgress);

            await serverPromise;

            // send IV
            server.send(JSON.stringify({ status: 500 }));

            await expect(resultPromise).rejects.not.toBeNull();
        });

        test("It should throw Exception because server send incorrect message", async () => {
            const uploadFile = new UploadFileServer(file);
            const server = new WS(Utils.serverWebsocketUrl("api/upload"));

            const mockProgress = jest.fn();
            const serverPromise = server.connected;
            const resultPromise = uploadFile.upload(mockProgress);

            await serverPromise;

            server.send(JSON.stringify({ incorrectMsg: 200 }));

            await expect(resultPromise).rejects.not.toBeNull();
            expect(mockProgress).not.toBeCalled();
        });

        test("It should throw Exception because websocket.onerror", async () => {
            const uploadFile = new UploadFileServer(file);
            const server = new WS(Utils.serverWebsocketUrl("api/upload"));

            const serverPromise = server.connected;
            const mockProgress = jest.fn();
            const resultPromise = uploadFile.upload(mockProgress);

            await serverPromise;

            server.error();

            await expect(resultPromise).rejects.not.toBeNull();
            expect(mockProgress).not.toBeCalled();
        });

        test("It should throw Exception because progress function throws Error", async () => {
            const uploadFile = new UploadFileServer(file);
            const server = new WS(Utils.serverWebsocketUrl("api/upload"));

            const serverPromise = server.connected;
            const mockProgress = jest.fn().mockImplementation((u: number) => {
                throw new Error("test" + u);
            });
            const resultPromise = uploadFile.upload(mockProgress);

            await serverPromise;

            // IV
            server.send(JSON.stringify({ status: 200 }));
            // flag
            server.send(JSON.stringify({ status: 200 }));
            // salt
            server.send(JSON.stringify({ status: 200 }));
            // metadata + length
            server.send(JSON.stringify({ status: 200 }));
            // send first chunk
            server.send(JSON.stringify({ status: 200 }));
            await expect(resultPromise).rejects.not.toBeNull();
            expect(mockProgress.mock.calls[0][0]).toBe(firstChunk.length);
        });
    });
});
