export default class FileStream {
    private file: File;
    private readonly size: number;
    private index: number = 0;
    private chunkSize: number = 65536;

    public constructor(file: File) {
        this.file = file;
        this.size = file.size;
    }

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
