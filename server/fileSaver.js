const Storage = require("./storage");

module.exports = class FileSaver {
    constructor(id, path) {
        this.id = id;
        this.storage = new Storage(path);
        this.stream = this.storage.writableStream(id);
    }

    async saveInitializationVector(iv) {
        await this.saveChunk(iv);
    }

    async saveMetadata(metadata) {
        const len = metadata.length;
        if (len > 64 * 1024) {
            throw new Error("Length of metadata is too long");
        }

        let buffer = Buffer.alloc(2);
        buffer.writeUInt16BE(len, 0);

        await this.saveChunk(buffer);
        await this.saveChunk(metadata);
    }

    saveChunk(chunk) {
        return new Promise((resolve, _reject) => {
            if (!this.stream.write(chunk)) {
                this.stream.once("drain", resolve);
            } else {
                resolve();
            }
        });
    }

    async clear() {
        this.end();
        await this.storage.remove(this.id);
    }

    end() {
        this.stream.end();
    }
};
