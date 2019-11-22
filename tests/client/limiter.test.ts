import Config from "../../client/src/ts/config";
import Limiter from "../../client/src/ts/limiter";

describe("Limiter test", () => {
    describe("Default size", () => {
        const limiter = new Limiter();
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

    describe("Custom size", () => {
        const limiter = new Limiter(25);
        test("It should return true because it smaller than default size", () => {
            const size = 25 - 1;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(true);
        });

        test("It should return true because it same size", () => {
            const size = 25;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(true);
        });

        test("It should return false because it bigger than default size", () => {
            const size = 25 + 1;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(false);
        });
    });

    describe("Size of 0", () => {
        const limiter = new Limiter(0);

        test("It should return true because it same size", () => {
            const size = 0;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(true);
        });

        test("It should return false because it bigger than default size", () => {
            const size = 1;
            const result = limiter.validateFileSize(size);
            expect(result).toBe(false);
        });
    });
});
