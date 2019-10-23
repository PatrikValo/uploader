export default class FileStream {
    private _file: File;
    private readonly _size: number;
    private _index: number = 0;
    private _chunkSize: number = 65536;

    public constructor(file: File) {
        this._file = file;
        this._size = file.size;
    }

    public read(): Promise<{ done: boolean; value: Uint8Array }> {
        return new Promise((resolve, reject) => {
            if (this._index >= this._size) {
                return resolve({ done: true, value: new Uint8Array(0) });
            }

            const start = this._index;
            let end = this._index + this._chunkSize;

            if (end > this._size) {
                end = this._size;
            }

            this._index = end;

            const fileReader: FileReader = new FileReader();
            fileReader.onload = function() {
                return resolve({
                    done: false,
                    value: <Uint8Array>fileReader.result
                });
            };
            fileReader.onerror = reject;

            const slice: Blob = this._file.slice(start, end);
            fileReader.readAsArrayBuffer(slice);
        });
    }
}
