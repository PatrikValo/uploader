import Config from "./config";

export default class FileStream {
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
     * different chunk of file. If there is nothing to read, done property is True and
     * value property is empty Uint8Array. Value is not empty and done property
     * is False, when there is still data, which can be read from file.
     *
     * @return Object contains done and value property
     */
    public read(): Promise<{ done: boolean; value: Uint8Array }> {
        return new Promise((resolve, reject) => {
            if (this.index >= this.size) {
                return resolve({ done: true, value: new Uint8Array(0) });
            }

            const start = this.index;
            let end = this.index + this.chunkSize;

            if (end > this.size) {
                end = this.size;
            }

            this.index = end;

            const fileReader: FileReader = new FileReader();

            fileReader.onload = () => {
                return resolve({
                    done: false,
                    value: new Uint8Array(fileReader.result as ArrayBuffer)
                });
            };

            fileReader.onerror = reject;

            const slice: Blob = this.file.slice(start, end);
            fileReader.readAsArrayBuffer(slice);
        });
    }
}
