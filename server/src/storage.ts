import fs from "fs";
import pathObj from "path";
import Config from "./config";

export class FileHandle {
    private fd: number | null;

    public constructor(fd: number) {
        this.fd = fd;
    }

    public read(start: number, end: number): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            if (!this.fd) {
                return reject(new Error("File is already closed"));
            }

            if (start < 0 || end < 0) {
                return reject(new Error("Negative parameter"));
            }

            const length: number = end + 1 - start;
            const buffer: Buffer = Buffer.alloc(length);

            fs.read(
                this.fd,
                buffer,
                0,
                length,
                start,
                (err, bytesRead, buff) => {
                    if (err) {
                        return reject(err);
                    }

                    if (bytesRead !== length) {
                        return reject(
                            new Error("File doesn't have correct size")
                        );
                    }

                    return resolve(buff);
                }
            );
        });
    }

    public readChunk(chunkNumber: number, startData: number): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            if (!this.fd) {
                return reject(new Error("File is already closed"));
            }

            if (chunkNumber < 0 || startData < 0) {
                return reject(new Error("Negative parameter"));
            }

            fs.fstat(this.fd, async (err, stats) => {
                if (err) {
                    return reject(err);
                }

                const fileSize = stats.size;
                const chunkSize = Config.chunkSize;

                const start = startData + chunkNumber * chunkSize;

                if (start >= fileSize) {
                    return resolve(Buffer.from([]));
                }

                const end =
                    start + chunkSize - 1 > fileSize
                        ? fileSize - 1
                        : start + chunkSize - 1;
                try {
                    const chunk = await this.read(start, end);
                    return resolve(chunk);
                } catch (e) {
                    return reject(e);
                }
            });
        });
    }

    public close(): Promise<void> {
        return new Promise(resolve => {
            if (this.fd) {
                fs.close(this.fd, () => {
                    this.fd = null;
                    return resolve();
                });
            } else {
                return resolve();
            }
        });
    }
}

export class Storage {
    private readonly path: string;

    public constructor(path?: string) {
        this.path = path || Config.spacePath;
    }

    public open(id: string): Promise<FileHandle> {
        return new Promise((resolve, reject) => {
            const path = pathObj.join(this.path, id);

            fs.open(path, "r", (err, fd) => {
                if (err) {
                    return reject(err);
                }

                return resolve(new FileHandle(fd));
            });
        });
    }

    public exist(id: string): boolean {
        const path = pathObj.join(this.path, id);
        try {
            fs.accessSync(path, fs.constants.R_OK);
            return true;
        } catch (e) {
            return false;
        }
    }

    public remove(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const path = pathObj.join(this.path, id);

            fs.unlink(path, err => {
                if (err) {
                    return reject(err);
                }
                return resolve(true);
            });
        });
    }

    public writableStream(id: string): fs.WriteStream {
        const path = pathObj.join(this.path, id);
        return fs.createWriteStream(path);
    }
}
