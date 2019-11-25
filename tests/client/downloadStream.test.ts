import mock from "xhr-mock";
import Config from "../../client/src/ts/config";
import DownloadStream from "../../client/src/ts/downloadStream";
import Utils from "../../client/src/ts/utils";

describe("DownloadStream tests", () => {
    const firstChunk = [12];
    for (let i = 0; i < Config.client.chunkSize - 2; i++) {
        firstChunk.push(200);
    }
    firstChunk.push(12);

    const secondChunk = [1, 2, 3, 4, 5, 6, 7, 8];
    const url = Utils.server.classicUrl("/api/download/25-id");

    beforeEach(() => mock.setup());
    afterEach(() => mock.teardown());

    test("It should return correct all data", async () => {
        expect.assertions(3);

        const downloadStream = new DownloadStream(url);

        mock.get(url + "/0", (req, res) => {
            return res.status(200).body(new Uint8Array(firstChunk));
        });

        mock.get(url + "/1", (req, res) => {
            return res.status(200).body(new Uint8Array(secondChunk));
        });

        mock.get(url + "/2", (req, res) => {
            return res.status(200).body(new Uint8Array(0));
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
        expect.assertions(2);

        const downloadStream = new DownloadStream(url);

        mock.get(url + "/0", (req, res) => {
            return res.status(200).body(new Uint8Array(firstChunk));
        });

        mock.get(url + "/1", (req, res) => {
            return res.status(404).body(new Uint8Array(secondChunk));
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
        expect.assertions(1);

        const downloadStream = new DownloadStream(url);

        mock.get(url + "/0", (req, res) => {
            return res.status(200).body(null);
        });

        const resultPromise = downloadStream.read();

        await expect(resultPromise).rejects.toEqual(
            new Error("Empty response")
        );
    });

    test("It should throw Exception after bad status", async () => {
        expect.assertions(1);

        const downloadStream = new DownloadStream(url);

        mock.get(url + "/0", (req, res) => {
            return res.status(500).body(null);
        });

        const resultPromise = downloadStream.read();

        await expect(resultPromise).rejects.toEqual(new Error("500"));
    });
});
