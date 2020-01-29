import Config from "./config";
import { FileHandle, Storage } from "./storage";

async function lengthMetadata(file: FileHandle): Promise<number> {
    const length = await file.read(
        Config.ivSize + Config.flagsSize + Config.saltSize,
        Config.ivSize + Config.flagsSize + Config.saltSize + 1
    );
    return length.readUInt16BE(0);
}

export default class FileReader {
    private readonly filePromise: Promise<FileHandle>;

    public constructor(id: string, path?: string) {
        const storage = new Storage(path);
        if (!storage.exist(id)) {
            throw new Error("No such file or directory");
        }

        this.filePromise = storage.open(id);
    }

    public async initializationVector(): Promise<Buffer> {
        const file = await this.filePromise;
        return file.read(0, Config.ivSize - 1);
    }

    public async flags(): Promise<Buffer> {
        const file = await this.filePromise;
        const start = Config.ivSize;
        const end = Config.ivSize + Config.flagsSize - 1;
        return file.read(start, end);
    }

    public async salt(): Promise<Buffer> {
        const file = await this.filePromise;
        const start = Config.ivSize + Config.flagsSize;
        const end = Config.ivSize + Config.flagsSize + Config.saltSize - 1;
        return file.read(start, end);
    }

    public async metadata(): Promise<Buffer> {
        const file = await this.filePromise;
        const length = await lengthMetadata(file);
        const start = Config.ivSize + Config.flagsSize + Config.saltSize + 2;
        const end =
            Config.ivSize + Config.flagsSize + Config.saltSize + 2 + length - 1;

        return file.read(start, end);
    }

    public async chunk(chunkNumber: number): Promise<Buffer> {
        const file = await this.filePromise;
        const length = await lengthMetadata(file);
        const start =
            Config.ivSize + Config.flagsSize + Config.saltSize + 2 + length;

        return file.readChunk(chunkNumber, start);
    }

    public async close(): Promise<void> {
        const file = await this.filePromise;
        return file.close();
    }
}
