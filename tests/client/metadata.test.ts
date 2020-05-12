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
            expect(metadata.getName()).toEqual("test.js");
            expect(metadata.getSize()).toBe(0);
        });

        test("It should create correct metadata object from file object with empty name", () => {
            const customFile = new File([blob], "");
            const metadata = new Metadata(customFile);
            expect(metadata.getName()).toEqual("");
            expect(metadata.getSize()).toBe(0);
        });

        test("It should create correct metadata object from Uint8Array object", () => {
            const uint = new TextEncoder().encode(
                '{"name":"test.js","size":0}'
            );
            const metadata = new Metadata(uint);
            expect(metadata.getName()).toEqual("test.js");
            expect(metadata.getSize()).toBe(0);
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

    describe("lengthToNumber", () => {
        test("It should return correct number, which is <= 15", () => {
            let result = Metadata.lengthToNumber(new Uint8Array([0, 0]));
            expect(result).toBe(0);

            result = Metadata.lengthToNumber(new Uint8Array([0, 14]));
            expect(result).toBe(14);

            result = Metadata.lengthToNumber(new Uint8Array([0, 15]));
            expect(result).toBe(15);
        });

        test("It should return correct number, which is > 15 and <= 255", () => {
            let result = Metadata.lengthToNumber(new Uint8Array([0, 17]));
            expect(result).toBe(17);

            result = Metadata.lengthToNumber(new Uint8Array([0, 254]));
            expect(result).toBe(254);

            result = Metadata.lengthToNumber(new Uint8Array([0, 255]));
            expect(result).toBe(255);
        });

        test("It should return correct number, which is > 255 and <= 65535", () => {
            let result = Metadata.lengthToNumber(new Uint8Array([1, 254]));
            expect(result).toBe(510);

            result = Metadata.lengthToNumber(new Uint8Array([255, 254]));
            expect(result).toBe(65534);

            result = Metadata.lengthToNumber(new Uint8Array([255, 255]));
            expect(result).toBe(65535);
        });

        test("It should throw exception because length of array is not correct", () => {
            expect(() => {
                Metadata.lengthToNumber(new Uint8Array([1, 254, 255]));
            }).toThrow();

            expect(() => {
                Metadata.lengthToNumber(new Uint8Array([1]));
            }).toThrow();

            expect(() => {
                Metadata.lengthToNumber(new Uint8Array([0, 0, 255]));
            }).toThrow();
        });
    });

    describe("lengthToUint8Array", () => {
        test("It should return correct array for number, which is <= 15", () => {
            let result = Metadata.lengthToUint8Array(0);
            expect(result).toStrictEqual(new Uint8Array([0, 0]));

            result = Metadata.lengthToUint8Array(14);
            expect(result).toStrictEqual(new Uint8Array([0, 14]));

            result = Metadata.lengthToUint8Array(15);
            expect(result).toStrictEqual(new Uint8Array([0, 15]));
        });

        test("It should return correct array for number, which is > 15 and <= 255", () => {
            let result = Metadata.lengthToUint8Array(17);
            expect(result).toStrictEqual(new Uint8Array([0, 17]));

            result = Metadata.lengthToUint8Array(254);
            expect(result).toStrictEqual(new Uint8Array([0, 254]));

            result = Metadata.lengthToUint8Array(255);
            expect(result).toStrictEqual(new Uint8Array([0, 255]));
        });

        test("It should return correct array for number, which is > 255 and <= 65535", () => {
            let result = Metadata.lengthToUint8Array(510);
            expect(result).toStrictEqual(new Uint8Array([1, 254]));

            result = Metadata.lengthToUint8Array(65534);
            expect(result).toStrictEqual(new Uint8Array([255, 254]));

            result = Metadata.lengthToUint8Array(65535);
            expect(result).toStrictEqual(new Uint8Array([255, 255]));
        });

        test("It should throw exception because number is too big", () => {
            expect(() => {
                Metadata.lengthToUint8Array(65536);
            }).toThrow();

            expect(() => {
                Metadata.lengthToUint8Array(65537);
            }).toThrow();

            expect(() => {
                Metadata.lengthToUint8Array(800000);
            }).toThrow();
        });
    });
});
