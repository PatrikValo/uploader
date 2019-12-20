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
    public readonly name: string;
    public readonly size: number;

    public constructor(file: IFile | Uint8Array) {
        // Uint8Array
        if (file instanceof Uint8Array) {
            const obj = this.createJSONObject(file);
            this.name = obj.name;
            this.size = obj.size;
            return;
        }

        // IFile
        this.name = file.name;
        this.size = file.size;
    }

    public toUint8Array(): Uint8Array {
        const str = this.toJSON();
        return Utils.stringToUint8Array(str);
    }

    public toJSON(): string {
        return JSON.stringify({
            name: this.name,
            size: this.size
        });
    }

    // noinspection JSMethodCanBeStatic
    private createJSONObject(arr: Uint8Array): IMetadata {
        const json = Utils.Uint8ArrayToString(arr);
        return JSON.parse(json);
    }
}
