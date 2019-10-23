export default class Metadata {
    private readonly _name: string;
    private readonly _type: string;
    private readonly _size: number;

    public constructor(name: string, type: string, size: number) {
        if (!name || !size) throw new Error("Name and size must be not null");

        this._name = name;
        this._type = type || "";
        this._size = size;
    }

    public toJSON(): string {
        return JSON.stringify({
            name: this._name,
            type: this._type,
            size: this._size
        });
    }

    public toUint8Array(): Uint8Array {
        const encoder: TextEncoder = new TextEncoder();
        return encoder.encode(this.toJSON());
    }
}
