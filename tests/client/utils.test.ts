import Config from "../../client/src/ts/config";
import Utils from "../../client/src/ts/utils";

describe("Utils tests", () => {
    describe("Server part", () => {
        const pro = Config.server.protocol;
        const port = Config.server.port;
        const host = Config.server.host;
        describe("WebsocketUrl", () => {
            const p = pro === "http" ? "ws" : "wss";
            test("It should return correct url without path as parameter", () => {
                const correct = `${p}://${host}:${port}`;
                const result = Utils.server.websocketUrl();
                expect(result).toBe(correct);
            });
            test("It should return correct url with slash before path as parameter", () => {
                const path = "/download/websocket/abc";
                const correct = `${p}://${host}:${port}${path}`;
                const result = Utils.server.websocketUrl(path);
                expect(result).toBe(correct);
            });
            test("It should return correct url without slash before path as parameter", () => {
                const path = "download/websocket/abc";
                const correct = `${p}://${host}:${port}/${path}`;
                const result = Utils.server.websocketUrl(path);
                expect(result).toBe(correct);
            });
        });
        describe("ClassicUrl", () => {
            test("It should return correct url without path as parameter", () => {
                const correct = `${pro}://${host}:${port}`;
                const result = Utils.server.classicUrl();
                expect(result).toBe(correct);
            });
            test("It should return correct url with slash before path as parameter", () => {
                const path = "/download/abc";
                const correct = `${pro}://${host}:${port}${path}`;
                const result = Utils.server.classicUrl(path);
                expect(result).toBe(correct);
            });
            test("It should return correct url without slash before path as parameter", () => {
                const path = "download/abc";
                const correct = `${pro}://${host}:${port}/${path}`;
                const result = Utils.server.classicUrl(path);
                expect(result).toBe(correct);
            });
        });
    });

    describe("Client part", () => {
        describe("BuildUrl", () => {
            const pro = Config.client.protocol;
            const port = Config.client.port;
            const host = Config.client.host;
            test("It should return correct url with empty each parameter", () => {
                const correct = `${pro}://${host}:${port}/`;
                const result = Utils.buildUrl("", "", "");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty base parameter", () => {
                const correct = `${pro}://${host}:${port}/25897-56#258_25`;
                const result = Utils.buildUrl("", "25897-56", "258_25");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty base parameter and key parameter", () => {
                const correct = `${pro}://${host}:${port}/25897-56`;
                const result = Utils.buildUrl("", "25897-56", "");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty id parameter", () => {
                const correct = `${pro}://${host}:${port}/download#25`;
                const result = Utils.buildUrl("download", "", "25");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty id parameter and key parameter", () => {
                const correct = `${pro}://${host}:${port}/download`;
                const result = Utils.buildUrl("download", "", "");
                expect(result).toBe(correct);
            });

            test("It should return correct url with empty key parameter", () => {
                const correct = `${pro}://${host}:${port}/download/25`;
                const result = Utils.buildUrl("download", "25", "");
                expect(result).toBe(correct);
            });

            test("It should return correct url with hash character before key parameter", () => {
                const correct = `${pro}://${host}:${port}/download/25#125`;
                const result = Utils.buildUrl("download", "25", "#125");
                expect(result).toBe(correct);
            });

            test("It should return correct url each parameter is given", () => {
                const correct = `${pro}://${host}:${port}/download/25#125`;
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
});
