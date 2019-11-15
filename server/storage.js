const fs = require("fs");
const config = require("./config");
const pathObj = require("path");

module.exports = class Storage {
    constructor(path) {
        this.path = path || config.spacePath;
    }

    open(id) {
        const path = pathObj.join(this.path, id);
        return fs.openSync(path, "r");
    }

    close(fd) {
        fs.closeSync(fd);
    }

    exist(id) {
        const path = pathObj.join(this.path, id);

        try {
            fs.accessSync(path, fs.constants.R_OK);
            return true;
        } catch (err) {
            return false;
        }
    }

    read(fd, start, end) {
        return new Promise((resolve, reject) => {
            const length = end + 1 - start;
            let buffer = Buffer.alloc(length);

            fs.read(fd, buffer, 0, length, start, (err, bytesRead, buffer) => {
                if (err) return reject(err);

                if (bytesRead !== length)
                    return reject("File doesn't have correct size");

                return resolve(buffer);
            });
        });
    }

    readChunk(fd, chunkNumber, startData) {
        return new Promise((resolve, reject) => {
            const self = this;
            fs.fstat(fd, async (err, stats) => {
                if (err) return reject(err);

                const fileSize = stats.size;
                const chunkSize = config.chunkSize;

                const start = startData + chunkNumber * chunkSize;

                if (start > fileSize) {
                    return resolve(null);
                }

                const end =
                    start + chunkSize - 1 > fileSize
                        ? fileSize - 1
                        : start + chunkSize - 1;
                try {
                    const chunk = await self.read(fd, start, end);
                    return resolve(chunk);
                } catch (e) {
                    return reject(e);
                }
            });
        });
    }

    remove(id) {
        return new Promise((resolve, reject) => {
            const path = pathObj.join(this.path, id);

            fs.unlink(path, err => {
                if (err) return reject(err);
                return resolve(true);
            });
        });
    }

    readableStream(id, start, end) {
        const path = pathObj.join(this.path, id);

        return fs.createReadStream(path, {
            start: start || 0,
            end: end || Infinity,
            highWaterMark: config.chunkSize
        });
    }

    writableStream(id) {
        const path = pathObj.join(this.path, id);
        return fs.createWriteStream(path);
    }
};
