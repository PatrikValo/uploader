import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import mock from "xhr-mock";
import Config from "../../client/src/ts/config";
import Utils from "../../client/src/ts/utils";

(window as any).TextEncoder = Encoder;
(window as any).TextDecoder = Decoder;

describe("Utils tests", () => {
    describe("Server part", () => {
        const pro = Config.server.protocol;
        const port = Config.server.port ? ":" + Config.server.port : "";
        const host = Config.server.host;
        describe("WebsocketUrl", () => {
            const p = pro === "http" ? "ws" : "wss";
            test("It should return correct url without path as parameter", () => {
                const correct = `${p}://${host}${port}`;
                const result = Utils.server.websocketUrl();
                expect(result).toBe(correct);
            });
            test("It should return correct url with slash before path as parameter", () => {
                const path = "/download/websocket/abc";
                const correct = `${p}://${host}${port}${path}`;
                const result = Utils.server.websocketUrl(path);
                expect(result).toBe(correct);
            });
            test("It should return correct url without slash before path as parameter", () => {
                const path = "download/websocket/abc";
                const correct = `${p}://${host}${port}/${path}`;
                const result = Utils.server.websocketUrl(path);
                expect(result).toBe(correct);
            });
        });
        describe("ClassicUrl", () => {
            test("It should return correct url without path as parameter", () => {
                const correct = `${pro}://${host}${port}`;
                const result = Utils.server.classicUrl();
                expect(result).toBe(correct);
            });
            test("It should return correct url with slash before path as parameter", () => {
                const path = "/download/abc";
                const correct = `${pro}://${host}${port}${path}`;
                const result = Utils.server.classicUrl(path);
                expect(result).toBe(correct);
            });
            test("It should return correct url without slash before path as parameter", () => {
                const path = "download/abc";
                const correct = `${pro}://${host}${port}/${path}`;
                const result = Utils.server.classicUrl(path);
                expect(result).toBe(correct);
            });
        });
    });

    describe("Client part", () => {
        describe("BuildUrl", () => {
            const pro = Config.client.protocol;
            const port = Config.client.port ? ":" + Config.client.port : "";
            const host = Config.client.host;
            test("It should return correct url with empty each parameter", () => {
                const correct = `${pro}://${host}${port}/`;
                const result = Utils.buildUrl("", "", "");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty base parameter", () => {
                const correct = `${pro}://${host}${port}/25897-56#258_25`;
                const result = Utils.buildUrl("", "25897-56", "258_25");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty base parameter and key parameter", () => {
                const correct = `${pro}://${host}${port}/25897-56`;
                const result = Utils.buildUrl("", "25897-56", "");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty id parameter", () => {
                const correct = `${pro}://${host}${port}/download#25`;
                const result = Utils.buildUrl("download", "", "25");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty id parameter and key parameter", () => {
                const correct = `${pro}://${host}${port}/download`;
                const result = Utils.buildUrl("download", "", "");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty key parameter", () => {
                const correct = `${pro}://${host}${port}/download/25`;
                const result = Utils.buildUrl("download", "25", "");
                expect(result).toBe(correct);
            });

            test("It should return correct url with hash character before key parameter", () => {
                const correct = `${pro}://${host}${port}/download/25#125`;
                const result = Utils.buildUrl("download", "25", "#125");
                expect(result).toBe(correct);
            });

            test("It should return correct url each parameter is given", () => {
                const correct = `${pro}://${host}${port}/download/25#125`;
                const result = Utils.buildUrl("download", "25", "125");
                expect(result).toBe(correct);
            });
        });
    });

    describe("BuildPath", () => {
        test("It should return correct path with empty each parameter", () => {
            const correct = "/";
            const result = Utils.buildPath("", "", "");
            expect(result).toBe(correct);
        });

        test("It should return correct path with empty base parameter", () => {
            const correct = "/25897-56#258_25";
            const result = Utils.buildPath("", "25897-56", "258_25");
            expect(result).toBe(correct);
        });

        test("It should return correct path with empty base parameter and key parameter", () => {
            const correct = "/25897-56";
            const result = Utils.buildPath("", "25897-56", "");
            expect(result).toBe(correct);
        });

        test("It should return correct path with empty id parameter", () => {
            const correct = "/download#25";
            const result = Utils.buildPath("download", "", "25");
            expect(result).toBe(correct);
        });

        test("It should return correct path with empty id parameter and key parameter", () => {
            const correct = "/download";
            const result = Utils.buildPath("download", "", "");
            expect(result).toBe(correct);
        });

        test("It should return correct path with empty key parameter", () => {
            const correct = "/download/25";
            const result = Utils.buildPath("download", "25", "");
            expect(result).toBe(correct);
        });

        test("It should return correct path with hash character before key parameter", () => {
            const correct = "/download/25#125";
            const result = Utils.buildPath("download", "25", "#125");
            expect(result).toBe(correct);
        });

        test("It should return correct url each parameter is given", () => {
            const correct = "/download/25#125";
            const result = Utils.buildPath("download", "25", "125");
            expect(result).toBe(correct);
        });
    });

    describe("Base64", () => {
        const correctUint = new Uint8Array([106, 26, 35]);
        const correctStr = "ahoj";
        test("classic base64toUint8Array", () => {
            const result = Utils.base64toUint8Array(correctStr);
            expect(result).toStrictEqual(correctUint);
        });

        test("empty base64toUint8Array", () => {
            const result = Utils.base64toUint8Array("");
            expect(result).toStrictEqual(new Uint8Array(0));
        });

        test("classic Uint8ArrayToBase64", () => {
            const result = Utils.Uint8ArrayToBase64(correctUint);
            expect(result).toBe(correctStr);
        });

        test("empty Uint8ArrayToBase64", () => {
            const result = Utils.Uint8ArrayToBase64(new Uint8Array(0));
            expect(result).toBe("");
        });
    });

    describe("TextAndUint8Array", () => {
        const correctUint = new Uint8Array([97, 49, 98, 50, 81, 51]);
        const correctStr = "a1b2Q3";
        test("classic stringToUint8Array", () => {
            const result = Utils.stringToUint8Array(correctStr);
            expect(result).toStrictEqual(correctUint);
        });

        test("empty stringToUint8Array", () => {
            const result = Utils.stringToUint8Array("");
            expect(result).toStrictEqual(new Uint8Array(0));
        });

        test("classic Uint8ArrayToString", () => {
            const result = Utils.Uint8ArrayToString(correctUint);
            expect(result).toBe(correctStr);
        });

        test("empty Uint8ArrayToString", () => {
            const result = Utils.Uint8ArrayToString(new Uint8Array(0));
            expect(result).toBe("");
        });
    });

    describe("GetRequest", () => {
        beforeEach(() => mock.setup());
        afterEach(() => mock.teardown());
        const url = Utils.server.classicUrl("/api/download/25-id");
        describe("arraybuffer", () => {
            test("empty headers", async () => {
                const correctUint = new Uint8Array([25, 15, 40]);
                mock.get(url, (req, res) => {
                    expect(req.headers()).toStrictEqual({
                        "cache-control": "no-cache"
                    });
                    return res.status(200).body(correctUint);
                });

                const result = Utils.getRequest(url, [], "arraybuffer");

                await expect(result).resolves.toStrictEqual(correctUint);
            });

            test("not empty headers", async () => {
                const correctUint = new Uint8Array([25, 15, 40, 60]);
                mock.get(url, (req, res) => {
                    expect(req.headers()).toStrictEqual({
                        "cache-control": "no-cache",
                        "start-from": "20",
                        "x-chunk": "2"
                    });
                    return res.status(200).body(correctUint);
                });

                const headers = [
                    { header: "X-Chunk", value: "2" },
                    { header: "start-from", value: "20" }
                ];
                const result = Utils.getRequest(url, headers, "arraybuffer");

                await expect(result).resolves.toStrictEqual(correctUint);
            });

            test("correct status", async () => {
                const correctUint = new Uint8Array([25, 15, 40, 60]);
                mock.get(url, (req, res) => {
                    expect(req.headers()).toStrictEqual({
                        "cache-control": "no-cache",
                        "x-chunk": "2"
                    });
                    return res.status(206).body(correctUint);
                });

                const headers = [{ header: "X-Chunk", value: "2" }];
                const result = Utils.getRequest(url, headers, "arraybuffer");

                await expect(result).resolves.toStrictEqual(correctUint);
            });

            test("incorrect status", async () => {
                mock.get(url, (req, res) => {
                    expect(req.headers()).toStrictEqual({
                        "cache-control": "no-cache",
                        "x-chunk": "2"
                    });
                    return res.status(404).body(null);
                });

                const headers = [{ header: "X-Chunk", value: "2" }];
                const result = Utils.getRequest(url, headers, "arraybuffer");

                await expect(result).rejects.not.toBeNull();
            });

            test("error occured", async () => {
                mock.error(() => {
                    return;
                });
                mock.get(url, () => Promise.reject(new Error()));

                const headers = [{ header: "X-Chunk", value: "2" }];
                const result = Utils.getRequest(url, headers, "arraybuffer");

                await expect(result).rejects.not.toBeNull();
            });

            test("null status", async () => {
                mock.get(url, (req, res) => {
                    return res.body(new Uint8Array(0));
                });

                const headers = [{ header: "X-Chunk", value: "2" }];
                const result = Utils.getRequest(url, headers, "arraybuffer");

                await expect(result).rejects.not.toBeNull();
            });
        });
        describe("json", () => {
            test("empty headers", async () => {
                const correctJson = { result: "OK" };
                mock.get(url, (req, res) => {
                    expect(req.headers()).toStrictEqual({
                        "cache-control": "no-cache"
                    });
                    return res.status(200).body(JSON.stringify(correctJson));
                });

                const result = Utils.getRequest(url, [], "json");

                await expect(result).resolves.toStrictEqual(correctJson);
            });

            test("not empty headers", async () => {
                mock.get(url, (req, res) => {
                    return res.status(200).body(JSON.stringify(req.headers()));
                });

                const headers = [
                    { header: "X-Chunk", value: "2" },
                    { header: "start-from", value: "20" }
                ];
                const result = Utils.getRequest(url, headers, "json");

                await expect(result).resolves.toStrictEqual({
                    "cache-control": "no-cache",
                    "start-from": "20",
                    "x-chunk": "2"
                });
            });

            test("correct status", async () => {
                const correctJson = { result: "OK", chunk: 1 };
                mock.get(url, (req, res) => {
                    expect(req.headers()).toStrictEqual({
                        "cache-control": "no-cache",
                        "x-chunk": "2"
                    });
                    return res.status(206).body(JSON.stringify(correctJson));
                });

                const headers = [{ header: "X-Chunk", value: "2" }];
                const result = Utils.getRequest(url, headers, "json");

                await expect(result).resolves.toStrictEqual(correctJson);
            });

            test("incorrect status", async () => {
                mock.get(url, (req, res) => {
                    expect(req.headers()).toStrictEqual({
                        "cache-control": "no-cache"
                    });
                    return res.status(404).body(null);
                });

                const result = Utils.getRequest(url, [], "json");

                await expect(result).rejects.not.toBeNull();
            });
        });
    });
});
