export default class Metadata {
    public readonly name: string;
    public readonly type: string;
    public readonly size: number;

    public constructor(file: File | Uint8Array) {
        if (file instanceof File) {
            this.name = file.name;
            this.type = file.type;
            this.size = file.size;
        } else {
            const obj = this.createJSONObject(file);
            this.name = obj.name;
            this.type = obj.type;
            this.size = obj.size;
        }
    }

    private createJSONObject(
        arr: Uint8Array
    ): { name: string; type: string; size: number } {
        const decoder: TextDecoder = new TextDecoder();
        const json = decoder.decode(arr);
        return JSON.parse(json);
    }

    public toUint8Array(): Uint8Array {
        const encoder: TextEncoder = new TextEncoder();
        return encoder.encode(
            JSON.stringify({
                name: this.name,
                type: this.type,
                size: this.size
            })
        );
    }
}
