interface IFile {
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
        const encoder: TextEncoder = new TextEncoder();
        return encoder.encode(
            JSON.stringify({
                name: this.name,
                size: this.size
            })
        );
    }

    // noinspection JSMethodCanBeStatic
    private createJSONObject(arr: Uint8Array): IFile {
        const decoder: TextDecoder = new TextDecoder();
        const json = decoder.decode(arr);
        return JSON.parse(json);
    }
}
