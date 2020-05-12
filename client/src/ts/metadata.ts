import Utils from "./utils";

interface IFile {
    name: string;
    size: number;
}

interface IMetadata {
    name: string;
    size: number;
}

export default class Metadata {
    /**
     * It converts length of metadata from Uint8Array to number
     *
     * @param uint
     * @return length of metadata - number
     */
    public static lengthToNumber(uint: Uint8Array): number {
        if (uint.length !== 2) {
            throw new Error("Incorrect size");
        }
        const fst = uint[0].toString(16);
        let snd = uint[1].toString(16);
        snd = snd.length === 1 ? "0" + snd : snd;

        return parseInt(fst + snd, 16);
    }

    /**
     * It converts length of metadata from number to Uint8Array
     *
     * @param n
     * @return length of metadata - Uint8Array
     */
    public static lengthToUint8Array(n: number): Uint8Array {
        const hex = n.toString(16);
        const len = hex.length;

        if (len > 4) {
            throw new Error("Metadata is too long");
        }

        if (len <= 2) {
            return new Uint8Array([0, n]);
        }

        if (len === 3) {
            return new Uint8Array([
                parseInt(hex[0], 16),
                parseInt(hex.slice(1, 3), 16)
            ]);
        }

        return new Uint8Array([
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16)
        ]);
    }

    /**
     * It converts Uint8Array to object implements IMetadata
     *
     * @param arr
     * @return Object implements IMetadata
     */
    private static createJSONObject(arr: Uint8Array): IMetadata {
        const json = Utils.Uint8ArrayToString(arr);
        return JSON.parse(json);
    }

    private readonly name: string;
    private readonly size: number;

    public constructor(file: IFile | Uint8Array) {
        // Uint8Array
        if (file instanceof Uint8Array) {
            const obj = Metadata.createJSONObject(file);
            this.name = obj.name;
            this.size = obj.size;
            return;
        }

        // IFile
        this.name = file.name;
        this.size = file.size;
    }

    /**
     * Getter for name
     *
     * @return name
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Getter for size
     *
     * @return size
     */
    public getSize(): number {
        return this.size;
    }

    /**
     * It converts metadata to Uint8Array
     *
     * @return Uint8Array representation of metadata
     */
    public toUint8Array(): Uint8Array {
        const str = this.toJSON();
        return Utils.stringToUint8Array(str);
    }

    /**
     * It creates JSON representation of metadata
     *
     * @return json
     */
    public toJSON(): string {
        return JSON.stringify({
            name: this.name,
            size: this.size
        });
    }
}
