import fs from "fs";
import pathObj from "path";
import Config from "./config";

export default class Storage {
    public readonly path: string;

    public constructor(path?: string) {
        this.path = path || Config.spacePath;
    }

    public open(id: string): number {
        const path = pathObj.join(this.path, id);
        return fs.openSync(path, "r");
    }

    public close(fd: number): void {
        fs.closeSync(fd);
    }

    public exist(id: string): boolean {
        const path = pathObj.join(this.path, id);

        try {
            fs.accessSync(path, fs.constants.R_OK);
            return true;
        } catch (err) {
            return false;
        }
    }

    public read(fd: number, start: number, end: number): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const length: number = end + 1 - start;
            const buffer: Buffer = Buffer.alloc(length);

            fs.read(fd, buffer, 0, length, start, (err, bytesRead, buff) => {
                if (err) {
                    return reject(err);
                }

                if (bytesRead !== length) {
                    return reject("File doesn't have correct size");
                }

                return resolve(buff);
            });
        });
    }

    public readChunk(
        fd: number,
        chunkNumber: number,
        startData: number
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            fs.fstat(fd, async (err, stats) => {
                if (err) {
                    return reject(err);
                }

                const fileSize = stats.size;
                const chunkSize = Config.chunkSize;

                const start = startData + chunkNumber * chunkSize;

                if (start > fileSize) {
                    return resolve(null);
                }

                const end =
                    start + chunkSize - 1 > fileSize
                        ? fileSize - 1
                        : start + chunkSize - 1;
                try {
                    const chunk = await this.read(fd, start, end);
                    return resolve(chunk);
                } catch (e) {
                    return reject(e);
                }
            });
        });
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

    public readableStream(
        id: string,
        start?: number,
        end?: number
    ): fs.ReadStream {
        const path = pathObj.join(this.path, id);

        return fs.createReadStream(path, {
            end: end || Infinity,
            highWaterMark: Config.chunkSize,
            start: start || 0
        });
    }

    public writableStream(id: string): fs.WriteStream {
        const path = pathObj.join(this.path, id);
        return fs.createWriteStream(path);
    }
}
