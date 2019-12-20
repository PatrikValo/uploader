import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import Metadata from "../../client/src/ts/metadata";

(window as any).TextEncoder = Encoder;
(window as any).TextDecoder = Decoder;

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
        });

        test("It should create correct metadata object from file object with empty name", () => {
            const customFile = new File([blob], "");
            const metadata = new Metadata(customFile);
            expect(metadata.name).toEqual("");
            expect(metadata.size).toBe(0);
        });

        test("It should create correct metadata object from Uint8Array object", () => {
            const uint = new TextEncoder().encode(
                '{"name":"test.js","size":0}'
            );
            const metadata = new Metadata(uint);
            expect(metadata.name).toEqual("test.js");
            expect(metadata.size).toBe(0);
        });
    });

    describe("toJSON", () => {
        test("It should return correct JSON", () => {
            const metadata = new Metadata(file);
            const result = metadata.toJSON();
            const correct = '{"name":"test.js","size":0}';
            expect(result).toEqual(correct);
        });

        test("It should return correct JSON with empty name", () => {
            const customFile = new File([blob], "");
            const metadata = new Metadata(customFile);
            const result = metadata.toJSON();
            const correct = '{"name":"","size":0}';

            expect(result).toEqual(correct);
        });
    });

    describe("toUint8Array", () => {
        test("It should return correct Uint8Array", () => {
            const metadata = new Metadata(file);
            const result = metadata.toUint8Array();
            const correct = new TextEncoder().encode(
                '{"name":"test.js","size":0}'
            );
            expect(result).toEqual(correct);
        });

        test("It should return correct Uint8Array with empty name", () => {
            const customFile = new File([blob], "");
            const metadata = new Metadata(customFile);
            const result = metadata.toUint8Array();
            const correct = new TextEncoder().encode('{"name":"","size":0}');

            expect(result).toEqual(correct);
        });
    });
});
