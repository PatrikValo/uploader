import mock from "xhr-mock";
import AuthDropbox from "../../client/src/ts/authDropbox";
import Config from "../../client/src/ts/config";
import {
    DownloadStreamDropbox,
    DownloadStreamServer
} from "../../client/src/ts/downloadStream";
import Utils from "../../client/src/ts/utils";

const token = "token125";
jest.mock("../../client/src/ts/authDropbox", () => {
    return class {
        public getAccessToken(): string {
            return token;
        }
    };
});

describe("DownloadStream tests", () => {
    const firstChunk = [12];
    for (let i = 0; i < Config.client.chunkSize - 2; i++) {
        firstChunk.push(200);
    }
    firstChunk.push(12);

    const secondChunk = [1, 2, 3, 4, 5, 6, 7, 8];

    beforeEach(() => mock.setup());
    afterEach(() => mock.teardown());

    describe("DownloadStreamServer tests", () => {
        const url = Utils.serverClassicUrl("/api/download/25-id");
        test("It should return correct all data", async () => {
            expect.assertions(9);

            const downloadStream = new DownloadStreamServer("25-id", 250);

            mock.get(url, (req, res) => {
                const start = req.header("X-Start-From");
                const n = req.header("X-Chunk-Number");
                expect(start).toEqual("250");
                expect(n).not.toBeNull();
                switch (n) {
                    case "0":
                        return res.status(200).body(new Uint8Array(firstChunk));
                    case "1":
                        return res
                            .status(200)
                            .body(new Uint8Array(secondChunk));
                    default:
                        return res.status(200).body(new Uint8Array(0));
                }
            });

            let resultPromise = downloadStream.read();
            await expect(resultPromise).resolves.toEqual({
                done: false,
                value: new Uint8Array(firstChunk)
            });

            resultPromise = downloadStream.read();
            await expect(resultPromise).resolves.toEqual({
                done: false,
                value: new Uint8Array(secondChunk)
            });

            resultPromise = downloadStream.read();
            await expect(resultPromise).resolves.toEqual({
                done: true,
                value: new Uint8Array(new Uint8Array(0))
            });
        });

        test("It should return first chunk and after requesting second chunk throw Exception", async () => {
            expect.assertions(6);

            const downloadStream = new DownloadStreamServer("25-id", 0);

            mock.get(url, (req, res) => {
                const start = req.header("X-Start-From");
                const n = req.header("X-Chunk-Number");
                expect(start).toEqual("0");
                expect(n).not.toBeNull();
                switch (n) {
                    case "0":
                        return res.status(200).body(new Uint8Array(firstChunk));
                    case "1":
                        return res.status(404).body(new Uint8Array(0));
                    default:
                        return res.status(200).body(new Uint8Array(0));
                }
            });

            let resultPromise = downloadStream.read();
            await expect(resultPromise).resolves.toEqual({
                done: false,
                value: new Uint8Array(firstChunk)
            });

            resultPromise = downloadStream.read();
            await expect(resultPromise).rejects.toEqual(new Error("404"));
        });

        test("It should throw Exception after empty response", async () => {
            expect.assertions(3);

            const downloadStream = new DownloadStreamServer("25-id", 0);

            mock.get(url, (req, res) => {
                const start = req.header("X-Start-From");
                const n = req.header("X-Chunk-Number");
                expect(start).toEqual("0");
                expect(n).not.toBeNull();
                if (n === "0") {
                    return res.status(200).body(null);
                } else {
                    return res.status(404).body(new Uint8Array(0));
                }
            });

            const resultPromise = downloadStream.read();

            await expect(resultPromise).rejects.toEqual(
                new Error("Empty response")
            );
        });

        test("It should throw Exception after bad status", async () => {
            expect.assertions(3);

            const downloadStream = new DownloadStreamServer("25-id", 0);

            mock.get(url, (req, res) => {
                const start = req.header("X-Start-From");
                const n = req.header("X-Chunk-Number");
                expect(start).toEqual("0");
                expect(n).not.toBeNull();
                if (n === "0") {
                    return res.status(500).body(null);
                } else {
                    return res.status(404).body(new Uint8Array(0));
                }
            });

            const resultPromise = downloadStream.read();

            await expect(resultPromise).rejects.toEqual(new Error("500"));
        });
    });

    describe("DownloadStreamDropbox tests", () => {
        const url = "https://content.dropboxapi.com/2/files/download";
        const id = "25id6525";
        describe("Constructor", () => {
            const auth = new AuthDropbox();

            test("It should return correct value after await sizeEncryptedFile attribute", async () => {
                mock.post(
                    "https://api.dropboxapi.com/2/files/get_metadata",
                    (req, res) => {
                        expect(req.header("authorization")).toEqual(
                            "Bearer " + token
                        );
                        expect(req.body()).toStrictEqual(
                            JSON.stringify({ path: "/" + id })
                        );
                        return res.status(200).body(
                            JSON.stringify({
                                size: 50
                            })
                        );
                    }
                );
                const dbx = new DownloadStreamDropbox(id, 0, auth);
                await expect((dbx as any).sizeEncryptedFile).resolves.toBe(50);
            });

            describe("It should throw error after await sizeEncryptedFile attribute", () => {
                test("Bad status", async () => {
                    mock.post(
                        "https://api.dropboxapi.com/2/files/get_metadata",
                        (req, res) => {
                            expect(req.header("authorization")).toEqual(
                                "Bearer " + token
                            );
                            expect(req.body()).toStrictEqual(
                                JSON.stringify({ path: "/" + id })
                            );
                            return res.status(404).body(null);
                        }
                    );
                    const dbx = new DownloadStreamDropbox(id, 0, auth);
                    await expect(
                        (dbx as any).sizeEncryptedFile
                    ).rejects.not.toBeNull();
                });

                test("Bad return value", async () => {
                    mock.post(
                        "https://api.dropboxapi.com/2/files/get_metadata",
                        (req, res) => {
                            expect(req.header("authorization")).toEqual(
                                "Bearer " + token
                            );
                            expect(req.body()).toStrictEqual(
                                JSON.stringify({ path: "/" + id })
                            );
                            return res
                                .status(200)
                                .body(JSON.stringify({ notSize: 200 }));
                        }
                    );
                    const dbx = new DownloadStreamDropbox(id, 0, auth);
                    await expect(
                        (dbx as any).sizeEncryptedFile
                    ).rejects.not.toBeNull();
                });

                test("Empty response", async () => {
                    mock.post(
                        "https://api.dropboxapi.com/2/files/get_metadata",
                        (req, res) => {
                            expect(req.header("authorization")).toEqual(
                                "Bearer " + token
                            );
                            expect(req.body()).toStrictEqual(
                                JSON.stringify({ path: "/" + id })
                            );
                            return res.status(200).body(JSON.stringify(null));
                        }
                    );
                    const dbx = new DownloadStreamDropbox(id, 0, auth);
                    await expect(
                        (dbx as any).sizeEncryptedFile
                    ).rejects.not.toBeNull();
                });

                test("Empty error", async () => {
                    mock.error(() => {
                        return;
                    });
                    mock.post(
                        "https://api.dropboxapi.com/2/files/get_metadata",
                        () => Promise.reject(new Error())
                    );
                    const dbx = new DownloadStreamDropbox(id, 0, auth);
                    await expect(
                        (dbx as any).sizeEncryptedFile
                    ).rejects.not.toBeNull();
                });
            });
        });

        describe("Download", () => {
            const auth = new AuthDropbox();

            test("It should return correct all data", async () => {
                mock.post(
                    "https://api.dropboxapi.com/2/files/get_metadata",
                    (req, res) => {
                        expect(req.header("authorization")).toEqual(
                            "Bearer " + token
                        );
                        expect(req.body()).toStrictEqual(
                            JSON.stringify({ path: "/" + id })
                        );
                        return res.status(200).body(
                            JSON.stringify({
                                size:
                                    firstChunk.length + secondChunk.length + 25
                            })
                        );
                    }
                );
                const dbx = new DownloadStreamDropbox(id, 25, auth);

                mock.get(url, (req, res) => {
                    expect(req.header("authorization")).toEqual(
                        "Bearer " + token
                    );
                    expect(req.header("dropbox-api-arg")).toStrictEqual(
                        `{"path":"/${id}"}`
                    );

                    const range = req.header("range");
                    switch (range) {
                        case "bytes=25-65560":
                            return res
                                .status(200)
                                .body(new Uint8Array(firstChunk));
                        case "bytes=65561-65568":
                            return res
                                .status(200)
                                .body(new Uint8Array(secondChunk));
                        default:
                            return res.status(200).body(new Uint8Array(0));
                    }
                });

                let resultPromise = dbx.read();
                await expect(resultPromise).resolves.toEqual({
                    done: false,
                    value: new Uint8Array(firstChunk)
                });

                resultPromise = dbx.read();
                await expect(resultPromise).resolves.toEqual({
                    done: false,
                    value: new Uint8Array(secondChunk)
                });

                resultPromise = dbx.read();
                await expect(resultPromise).resolves.toEqual({
                    done: true,
                    value: new Uint8Array(new Uint8Array(0))
                });
            });

            test("It should throw Exception because server return smaller chunk", async () => {
                mock.post(
                    "https://api.dropboxapi.com/2/files/get_metadata",
                    (req, res) => {
                        expect(req.header("authorization")).toEqual(
                            "Bearer " + token
                        );
                        expect(req.body()).toStrictEqual(
                            JSON.stringify({ path: "/" + id })
                        );
                        return res.status(200).body(
                            JSON.stringify({
                                size:
                                    firstChunk.length + secondChunk.length + 25
                            })
                        );
                    }
                );
                const dbx = new DownloadStreamDropbox(id, 25, auth);

                mock.get(url, (req, res) => {
                    expect(req.header("authorization")).toEqual(
                        "Bearer " + token
                    );
                    expect(req.header("dropbox-api-arg")).toStrictEqual(
                        `{"path":"/${id}"}`
                    );

                    const range = req.header("range");
                    switch (range) {
                        case "bytes=25-65560":
                            return res
                                .status(200)
                                .body(new Uint8Array(firstChunk));
                        case "bytes=65561-65568":
                            return res
                                .status(200)
                                .body(new Uint8Array(secondChunk.slice(1)));
                        default:
                            return res.status(200).body(new Uint8Array(0));
                    }
                });

                let resultPromise = dbx.read();
                await expect(resultPromise).resolves.toEqual({
                    done: false,
                    value: new Uint8Array(firstChunk)
                });

                resultPromise = dbx.read();
                await expect(resultPromise).rejects.not.toBeNull();
            });

            test("It should throw Exception because server return empty response", async () => {
                mock.post(
                    "https://api.dropboxapi.com/2/files/get_metadata",
                    (req, res) => {
                        expect(req.header("authorization")).toEqual(
                            "Bearer " + token
                        );
                        expect(req.body()).toStrictEqual(
                            JSON.stringify({ path: "/" + id })
                        );
                        return res.status(200).body(
                            JSON.stringify({
                                size:
                                    firstChunk.length + secondChunk.length + 25
                            })
                        );
                    }
                );
                const dbx = new DownloadStreamDropbox(id, 25, auth);

                mock.get(url, (req, res) => {
                    expect(req.header("authorization")).toEqual(
                        "Bearer " + token
                    );
                    expect(req.header("dropbox-api-arg")).toStrictEqual(
                        `{"path": "/${id}"}`
                    );

                    const range = req.header("range");
                    return res.status(200).body(null);
                });

                const resultPromise = dbx.read();
                await expect(resultPromise).rejects.not.toBeNull();
            });

            test("It should throw Exception because server return bad status", async () => {
                mock.post(
                    "https://api.dropboxapi.com/2/files/get_metadata",
                    (req, res) => {
                        expect(req.header("authorization")).toEqual(
                            "Bearer " + token
                        );
                        expect(req.body()).toStrictEqual(
                            JSON.stringify({ path: "/" + id })
                        );
                        return res.status(200).body(
                            JSON.stringify({
                                size:
                                    firstChunk.length + secondChunk.length + 25
                            })
                        );
                    }
                );
                const dbx = new DownloadStreamDropbox(id, 25, auth);

                mock.get(url, (req, res) => {
                    expect(req.header("authorization")).toEqual(
                        "Bearer " + token
                    );
                    expect(req.header("dropbox-api-arg")).toStrictEqual(
                        `{"path": "/${id}"}`
                    );

                    const range = req.header("range");
                    return res.status(400).body(new Uint8Array(0));
                });

                const resultPromise = dbx.read();
                await expect(resultPromise).rejects.not.toBeNull();
            });
        });
    });
});
