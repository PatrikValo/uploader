import fs from "fs";
import { Storage } from "./storage";

export default class FileSaver {
    public readonly id: string;
    public readonly storage: Storage;
    public readonly stream: fs.WriteStream;

    public constructor(id: string, path?: string) {
        this.id = id;
        this.storage = new Storage(path);
        this.stream = this.storage.writableStream(id);
    }

    public saveChunk(chunk: Buffer): Promise<void> {
        return new Promise(resolve => {
            if (!this.stream.write(chunk)) {
                this.stream.once("drain", () => {
                    return resolve();
                });
            } else {
                return resolve();
            }
        });
    }

    public async clear(): Promise<void> {
        await this.end();
        await this.storage.remove(this.id);
    }

    public end(): Promise<void> {
        return new Promise(resolve => {
            this.stream.on("finish", () => {
                return resolve();
            });
            this.stream.end();
        });
    }
}
