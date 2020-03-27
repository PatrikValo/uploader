import { FileHandle, Storage } from "./storage";

export default class FileReader {
    private readonly filePromise: Promise<FileHandle>;

    public constructor(id: string, path?: string) {
        const storage = new Storage(path);
        if (!storage.exist(id)) {
            throw new Error("No such file or directory");
        }

        this.filePromise = storage.open(id);
    }

    public async size(): Promise<number> {
        const file = await this.filePromise;
        return file.size();
    }

    public async metadata(start: number, end: number): Promise<Buffer> {
        const file = await this.filePromise;
        return file.read(start, end);
    }

    public async chunk(chunkNumber: number, start: number): Promise<Buffer> {
        const file = await this.filePromise;
        return file.readChunk(chunkNumber, start);
    }

    public async close(): Promise<void> {
        const file = await this.filePromise;
        return file.close();
    }
}
