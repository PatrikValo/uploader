import config from "./config";
import { IReadStreamReturnValue, ReadStream } from "./readStream";

export default class FileStream extends ReadStream {
    private file: File;
    private readonly size: number;
    private index: number = 0;
    private chunkSize: number = config.client.chunkSize - 16;

    public constructor(file: File) {
        super();
        this.file = file;
        this.size = file.size;
    }

    public read(): Promise<IReadStreamReturnValue> {
        return new Promise((resolve, reject) => {
            if (this.index >= this.size) {
                return resolve(super.close());
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
                    super.enqueue(
                        new Uint8Array(fileReader.result as ArrayBuffer)
                    )
                );
            };

            fileReader.onerror = reject;

            const slice: Blob = this.file.slice(start, end);
            fileReader.readAsArrayBuffer(slice);
        });
    }
}
