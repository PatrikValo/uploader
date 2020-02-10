import { saveAs } from "file-saver";
import streamSaver from "streamsaver";
import { Cipher } from "./cipher";
import Metadata from "./metadata";
import { IReadStreamReturnValue, ReadStream } from "./readStream";
import Utils from "./utils";
const { createWriteStream } = streamSaver;

class DownloadStream extends ReadStream {
    private readonly url: string;
    private chunkNumber: number;
    private startFrom: number;

    public constructor(url: string, startFrom: number) {
        super();
        this.url = url;
        this.chunkNumber = 0;
        this.startFrom = startFrom;
    }

    public read(): Promise<IReadStreamReturnValue> {
        return new Promise(async (resolve, reject) => {
            try {
                const chunk = await this.downloadChunk(this.chunkNumber);
                this.chunkNumber++;

                if (!chunk) {
                    return resolve(super.close());
                }
                return resolve(super.enqueue(chunk));
            } catch (e) {
                return reject(e);
            }
        });
    }

    private downloadChunk(numberOfChunk: number): Promise<Uint8Array | null> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status !== 200) {
                    return reject(new Error(String(xhr.status)));
                }

                if (xhr.response) {
                    const chunk = new Uint8Array(xhr.response);
                    if (!chunk.length) {
                        return resolve(null);
                    }
                    return resolve(chunk);
                }

                reject(new Error("Empty response"));
            };

            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.open("get", this.url);
            xhr.setRequestHeader("X-Chunk-Number", numberOfChunk.toString());
            xhr.setRequestHeader("X-Start-From", this.startFrom.toString());
            xhr.responseType = "arraybuffer";
            xhr.send();
        });
    }
}

export default class DownloadFile {
    private readonly id: string;
    private readonly metadata: Metadata;
    private readonly cipher: Cipher;
    private readonly stream: DownloadStream;

    public constructor(
        id: string,
        metadata: Metadata,
        cipher: Cipher,
        startFrom: number
    ) {
        this.id = id;
        this.metadata = metadata;
        this.cipher = cipher;
        const url = Utils.server.classicUrl("/api/download/" + this.id);
        this.stream = new DownloadStream(url, startFrom);
    }

    public async download(blob: boolean, progress: (u: number) => any) {
        if (!blob) {
            return await this.downloadStream(progress);
        }

        return await this.downloadBlob(progress);
    }

    private async downloadStream(progress: (u: number) => any) {
        streamSaver.TransformStream = TransformStream;
        streamSaver.WritableStream = WritableStream;

        const writeStream: WritableStream = createWriteStream(
            this.metadata.name,
            {
                size: this.metadata.size
            },
            this.metadata.size
        );

        const writer = writeStream.getWriter();

        this.initAbortEvent(writer);

        try {
            let chunk = await this.stream.read();

            while (!chunk.done) {
                const decrypted = await this.cipher.decryptChunk(chunk.value);
                await writer.write(decrypted);
                progress(decrypted.length);
                chunk = await this.stream.read();
            }
        } catch (e) {
            // stop download window in browser
            await writer.abort("Exception");
            this.termAbortEvent();

            throw e;
        }

        await writer.close();

        this.termAbortEvent();
    }

    private async downloadBlob(progress: (u: number) => any) {
        let blob = new Blob([], { type: "application/octet-stream" });
        try {
            let chunk = await this.stream.read();

            while (!chunk.done) {
                const decrypted = await this.cipher.decryptChunk(chunk.value);
                blob = new Blob([blob, decrypted], {
                    type: "application/octet-stream"
                });
                progress(decrypted.length);
                chunk = await this.stream.read();
            }
        } catch (e) {
            throw e;
        }

        saveAs(blob, this.metadata.name);
    }

    private initAbortEvent(writer: WritableStreamDefaultWriter<any>): void {
        window.onunload = async () => {
            await writer.abort("Close window");
        };
    }

    // noinspection JSMethodCanBeStatic
    private termAbortEvent(): void {
        window.onunload = null;
    }
}
