import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import Metadata from "../../client/src/ts/metadata";
import Password from "../../client/src/ts/password";

(window as any).TextEncoder = Encoder;
(window as any).TextDecoder = Decoder;
// cipher is never calling in the code so implementation can be empty
jest.mock("../../client/src/ts/cipher", () => {
    return class {};
});

describe("Metadata tests", () => {
    const blob = new Blob([new Uint8Array(0)], {
        type: "application/javascript"
    });
    const file = new File([blob], "test.js");

    describe("Constructor", () => {
        test("It should create correct metadata object from file object", () => {
            const metadata = new Metadata(file);
            expect(metadata.name).toEqual("test.js");
            expect(metadata.size).toBe(0);
            expect(metadata.password).toBe(null);
        });

        test("It should create correct metadata object from file object with empty name", () => {
            const customFile = new File([blob], "");
            const metadata = new Metadata(customFile);
            expect(metadata.name).toEqual("");
            expect(metadata.size).toBe(0);
            expect(metadata.password).toBe(null);
        });

        test("It should create correct metadata object from file object and password", () => {
            const metadata = new Metadata(
                file,
                new Password("a", new Uint8Array([1, 2, 3]))
            );
            expect(metadata.name).toEqual("test.js");
            expect(metadata.size).toBe(0);
            expect(metadata.password).toEqual({
                salt: new Uint8Array([1, 2, 3])
            });
        });

        test("It should create correct metadata object from Uint8Array object", () => {
            const uint = new TextEncoder().encode(
                '{"name":"test.js","password":null,"size":0}'
            );
            const metadata = new Metadata(uint);
            expect(metadata.name).toEqual("test.js");
            expect(metadata.size).toBe(0);
            expect(metadata.password).toBe(null);
        });

        test("It should create correct metadata object from Uint8Array object and password", () => {
            const uint = new TextEncoder().encode(
                '{"name":"test.js","password":{"salt":[0,1,2]},"size":0}'
            );
            const metadata = new Metadata(uint);
            expect(metadata.name).toEqual("test.js");
            expect(metadata.size).toBe(0);
            expect(metadata.password).toEqual({
                salt: new Uint8Array([0, 1, 2])
            });
        });
    });

    describe("hasPassword", () => {
        test("It should return false, because there is not password", () => {
            const metadata = new Metadata(file);
            const result = metadata.hasPassword();
            expect(result).toBe(false);
        });

        test("It should return true, because there is password", () => {
            const metadata = new Metadata(
                file,
                new Password("file", new Uint8Array([0, 1, 2]))
            );
            const result = metadata.hasPassword();
            expect(result).toBe(true);
        });
    });

    describe("toJSON", () => {
        test("It should return correct JSON with null password", () => {
            const metadata = new Metadata(file);
            const result = metadata.toJSON();
            const correct = '{"name":"test.js","password":null,"size":0}';
            expect(result).toEqual(correct);
        });

        test("It should return correct JSON with not null password", () => {
            const metadata = new Metadata(
                file,
                new Password("234", new Uint8Array([0, 1, 2]))
            );
            const result = metadata.toJSON();
            const correct =
                '{"name":"test.js","password":{"salt":[0,1,2]},"size":0}';

            expect(result).toEqual(correct);
        });

        test("It should return correct JSON with empty name", () => {
            const customFile = new File([blob], "");
            const metadata = new Metadata(
                customFile,
                new Password("234", new Uint8Array([0, 1, 2]))
            );
            const result = metadata.toJSON();
            const correct = '{"name":"","password":{"salt":[0,1,2]},"size":0}';

            expect(result).toEqual(correct);
        });
    });

    describe("toUint8Array", () => {
        test("It should return correct Uint8Array with null password", () => {
            const metadata = new Metadata(file);
            const result = metadata.toUint8Array();
            const correct = new TextEncoder().encode(
                '{"name":"test.js","password":null,"size":0}'
            );
            expect(result).toEqual(correct);
        });

        test("It should return correct Uint8Array with not null password", () => {
            const metadata = new Metadata(
                file,
                new Password("234", new Uint8Array([0, 1, 2]))
            );
            const result = metadata.toUint8Array();
            const correct = new TextEncoder().encode(
                '{"name":"test.js","password":{"salt":[0,1,2]},"size":0}'
            );

            expect(result).toEqual(correct);
        });

        test("It should return correct Uint8Array with empty name", () => {
            const customFile = new File([blob], "");
            const metadata = new Metadata(
                customFile,
                new Password("234", new Uint8Array([0, 1, 2]))
            );
            const result = metadata.toUint8Array();
            const correct = new TextEncoder().encode(
                '{"name":"","password":{"salt":[0,1,2]},"size":0}'
            );

            expect(result).toEqual(correct);
        });
    });
});
