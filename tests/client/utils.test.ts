import config from "../../client/src/ts/config";
import DownloadStream from "../../client/src/ts/downloadStream";

describe("Utils", () => {
    describe("Server", () => {
        test("OK", async () => {
            const a = new DownloadStream("abc");
            (a as any).downloadChunk = async (
                numberOfChunk: number
            ): Promise<Uint8Array | null> => {
                return new Promise((resolve, reject) => {
                    resolve(new Uint8Array([25, 14]));
                });
            };
            const res = await a.read();
            expect(res.done).toBe(false);
            expect(res.value).toStrictEqual(new Uint8Array([25, 14]));
        });
    });
});
