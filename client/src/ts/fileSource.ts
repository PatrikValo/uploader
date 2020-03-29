import Config from "./config";

export default class FileSource {
    private file: File;
    private readonly size: number;
    private index: number = 0;
    private chunkSize: number = Config.client.chunkSize - 16;

    public constructor(file: File) {
        this.file = file;
        this.size = file.size;
    }

    /**
     * It reads one chunk of file. Each time when this method is called, it returns
     * different chunk of file. If there is nothing to read, it returns null.
     *
     * @return Chunk or null
     */
    public read(): Promise<Uint8Array | null> {
        return new Promise((resolve, reject) => {
            if (this.index >= this.size) {
                return resolve(null);
            }

            const start = this.index;
            let end = this.index + this.chunkSize;

            if (end > this.size) {
                end = this.size;
            }

            this.index = end;

            const fileReader: FileReader = new FileReader();

            fileReader.onload = () => {
                return resolve(
                    new Uint8Array(fileReader.result as ArrayBuffer)
                );
            };

            fileReader.onerror = reject;

            const slice: Blob = this.file.slice(start, end);
            fileReader.readAsArrayBuffer(slice);
        });
    }
}
