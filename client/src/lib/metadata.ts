export default class Metadata {
    private readonly _name: string;
    private readonly _type: string;
    private readonly _size: number;

    public constructor(file: File) {
        this._name = file.name;
        this._type = file.type;
        this._size = file.size;
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
