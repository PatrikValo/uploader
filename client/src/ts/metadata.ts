import Password from "./password";
import Utils from "./utils";

interface IFile {
    name: string;
    size: number;
}

interface IMetadata {
    name: string;
    size: number;
    password: { salt: Uint8Array } | null;
}

export default class Metadata {
    public readonly name: string;
    public readonly size: number;
    public password: { salt: Uint8Array } | null;

    public constructor(file: IFile | Uint8Array, password?: Password) {
        this.password = password ? { salt: password.salt } : null;

        // Uint8Array
        if (file instanceof Uint8Array) {
            const obj = this.createJSONObject(file);
            this.name = obj.name;
            this.size = obj.size;
            this.password = obj.password
                ? { salt: new Uint8Array(obj.password.salt) }
                : null;
            return;
        }

        // IFile
        this.name = file.name;
        this.size = file.size;
    }

    public hasPassword(): boolean {
        return !!this.password;
    }

    public toUint8Array(): Uint8Array {
        const str = this.toJSON();
        return Utils.stringToUint8Array(str);
    }

    public toJSON(): string {
        return JSON.stringify({
            name: this.name,
            password: this.password
                ? { salt: [].slice.call(this.password.salt) }
                : null,
            size: this.size
        });
    }

    // noinspection JSMethodCanBeStatic
    private createJSONObject(arr: Uint8Array): IMetadata {
        const json = Utils.Uint8ArrayToString(arr);
        return JSON.parse(json);
    }
}
