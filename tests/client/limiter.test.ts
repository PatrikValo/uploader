import Config from "../../client/src/ts/config";
import Limiter from "../../client/src/ts/limiter";

describe("Limiter test", () => {
    describe("Default size server", () => {
        const limiter = new Limiter(false);
        test("It should return true because it smaller than default size", () => {
            const size = Config.client.fileSizeLimit - 1;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(true);
        });

        test("It should return true because it same size", () => {
            const size = Config.client.fileSizeLimit;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(true);
        });

        test("It should return false because it bigger than default size", () => {
            const size = Config.client.fileSizeLimit + 1;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(false);
        });
    });

    describe("Default size dropbox", () => {
        const limiter = new Limiter(true);
        test("It should return true because it smaller than default size", () => {
            const size = Config.client.fileSizeLimitDropbox - 1;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(true);
        });

        test("It should return true because it same size", () => {
            const size = Config.client.fileSizeLimitDropbox;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(true);
        });

        test("It should return false because it bigger than default size", () => {
            const size = Config.client.fileSizeLimitDropbox + 1;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(false);
        });
    });
});
