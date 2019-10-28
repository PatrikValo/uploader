const Storage = require("./storage");

module.exports = class FileSaver {
    constructor(id, path) {
        this.id = id;
        this.storage = new Storage(path);
        this.stream = this.storage.writableStream(id);
    }

    saveInitializationVector(iv) {
        this.stream.write(iv);
    }

    saveMetadata(metadata) {
        const len = metadata.length;
        if (len > 64 * 1024) {
            throw new Error("Length of metadata is too long");
        }

        let buffer = Buffer.alloc(2);
        buffer.writeUInt16BE(len, 0);

        this.stream.write(buffer);
        this.stream.write(metadata);
    }

    saveChunk(chunk) {
        this.stream.write(chunk);
    }

    clear() {
        this.end();
        this.storage.remove(this.id);
    }

    end() {
        this.stream.end();
    }
};
