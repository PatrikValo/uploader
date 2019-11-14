export default class TransformStream implements UnderlyingSource {
    public pull: ReadableStreamDefaultControllerCallback<any> = this.read;

    private buffer: number[];
    private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
    private readonly chunkSize: number = 64 * 1024;
    private doneReader: boolean = false;

    public constructor(reader: ReadableStreamDefaultReader<Uint8Array>) {
        this.reader = reader;
        this.buffer = [];
    }

    private get emptyBuffer(): boolean {
        return !this.buffer.length;
    }

    private get fullBuffer(): boolean {
        return this.buffer.length >= this.chunkSize;
    }

    private chunkFromBuffer(): Promise<Uint8Array> {
        return new Promise(resolve => {
            const returnChunk = this.buffer.slice(0, this.chunkSize);
            this.buffer = this.buffer.slice(this.chunkSize);
            resolve(new Uint8Array(returnChunk));
        });
    }

    private saveChunkToBuffer(chunk: Uint8Array): Promise<void> {
        return new Promise(resolve => {
            const array = [].slice.call(chunk);
            this.buffer = this.buffer.concat(array);
            resolve();
        });
    }

    private flushBuffer(): Uint8Array {
        const result = new Uint8Array(this.buffer);
        this.buffer = [];
        return result;
    }

    private read(
        controller: ReadableStreamDefaultController<any>
    ): PromiseLike<void> {
        return new Promise(async resolve => {
            if (this.doneReader && this.emptyBuffer) {
                return resolve(controller.close());
            }

            if (this.fullBuffer) {
                const v = await this.chunkFromBuffer();
                return resolve(controller.enqueue(v));
            }

            if (!this.doneReader) {
                let chunk = await this.reader.read();
                this.doneReader = chunk.done;

                while (!this.doneReader) {
                    if (this.emptyBuffer) {
                        if (chunk.value.length === this.chunkSize) {
                            return resolve(controller.enqueue(chunk.value));
                        }
                        await this.saveChunkToBuffer(chunk.value);

                        if (this.fullBuffer) {
                            const v = await this.chunkFromBuffer();
                            return resolve(controller.enqueue(v));
                        }
                        chunk = await this.reader.read();
                        this.doneReader = chunk.done;
                    } else {
                        await this.saveChunkToBuffer(chunk.value);
                        if (this.fullBuffer) {
                            const v = await this.chunkFromBuffer();
                            return resolve(controller.enqueue(v));
                        }
                        chunk = await this.reader.read();
                        this.doneReader = chunk.done;
                    }
                }
            }

            if (this.fullBuffer) {
                const v = await this.chunkFromBuffer();
                return resolve(controller.enqueue(v));
            }
            // doneMe == false && freeSPace == true
            return resolve(controller.enqueue(this.flushBuffer()));
        });
    }
}
