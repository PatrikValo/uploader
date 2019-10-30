export default class Metadata {
    private static createJSONObject(
        arr: Uint8Array
    ): { name: string; type: string; size: number } {
        const decoder: TextDecoder = new TextDecoder();
        const json = decoder.decode(arr);
        return JSON.parse(json);
    }
    public readonly name: string;
    public readonly type: string;
    public readonly size: number;

    public constructor(file: File | Uint8Array) {
        if (file instanceof File) {
            this.name = file.name;
            this.type = file.type;
            this.size = file.size;
        } else {
            const obj = Metadata.createJSONObject(file);
            this.name = obj.name;
            this.type = obj.type;
            this.size = obj.size;
        }
    }

    public toUint8Array(): Uint8Array {
        const encoder: TextEncoder = new TextEncoder();
        return encoder.encode(
            JSON.stringify({
                name: this.name,
                size: this.size,
                type: this.type
            })
        );
    }
}
