import Config from "./config";
import Storage from "./storage";

async function lengthMetadata(fd: number, storage: Storage): Promise<number> {
    const length = await storage.read(
        fd,
        Config.ivSize + Config.flagsSize + Config.saltSize,
        Config.ivSize + Config.flagsSize + Config.saltSize + 1
    );
    return length.readUInt16BE(0);
}

export default class FileReader {
    public readonly id: string;
    public readonly storage: Storage;

    public constructor(id: string, path?: string) {
        this.id = id;
        this.storage = new Storage(path);
        if (!this.storage.exist(id)) {
            throw new Error("No such file or directory");
        }
    }

    public async initializationVector(): Promise<Buffer> {
        const fd = this.storage.open(this.id);
        const iv = await this.storage.read(fd, 0, Config.ivSize - 1);
        this.storage.close(fd);
        return iv;
    }

    public async flags(): Promise<Buffer> {
        const fd = this.storage.open(this.id);
        const flags = await this.storage.read(
            fd,
            Config.ivSize,
            Config.ivSize + Config.flagsSize - 1
        );
        this.storage.close(fd);
        return flags;
    }

    public async salt(): Promise<Buffer> {
        const fd = this.storage.open(this.id);
        const salt = await this.storage.read(
            fd,
            Config.ivSize + Config.flagsSize,
            Config.ivSize + Config.flagsSize + Config.saltSize - 1
        );
        this.storage.close(fd);
        return salt;
    }

    public async metadata(): Promise<Buffer> {
        const fd = this.storage.open(this.id);
        const length = await lengthMetadata(fd, this.storage);

        const metadata = await this.storage.read(
            fd,
            Config.ivSize + Config.flagsSize + Config.saltSize + 2,
            Config.ivSize + Config.flagsSize + Config.saltSize + 2 + length - 1
        );
        this.storage.close(fd);
        return metadata;
    }

    public async chunk(chunkNumber: number): Promise<Buffer> {
        const fd = this.storage.open(this.id);
        const length = await lengthMetadata(fd, this.storage);
        const start =
            Config.ivSize + Config.flagsSize + Config.saltSize + 2 + length;

        const chunk = await this.storage.readChunk(fd, chunkNumber, start);

        this.storage.close(fd);
        return chunk;
    }
}
