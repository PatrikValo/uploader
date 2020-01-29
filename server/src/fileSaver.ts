import fs from "fs";
import Config from "./config";
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

    public async saveInitializationVector(iv: Buffer): Promise<void> {
        if (iv.length !== Config.ivSize) {
            throw new Error("Length of IV is not correct");
        }
        await this.saveChunk(iv);
    }

    public async saveMetadata(metadata: Buffer): Promise<void> {
        const len = metadata.length;
        if (metadata.length > Config.chunkSize) {
            throw new Error("Length of metadata is too long");
        }

        const buffer = Buffer.alloc(2);
        buffer.writeUInt16BE(len, 0);

        await this.saveChunk(buffer);
        await this.saveChunk(metadata);
    }

    public async saveFlags(flags: Buffer): Promise<void> {
        if (flags.length !== Config.flagsSize) {
            throw new Error("Length of flags is not correct");
        }

        await this.saveChunk(flags);
    }

    public async saveSalt(salt: Buffer): Promise<void> {
        if (salt.length !== Config.saltSize) {
            throw new Error("Length of salt is not correct");
        }

        await this.saveChunk(salt);
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
