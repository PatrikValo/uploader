const Storage = require("./storage");

module.exports = class FileSaver {
    constructor(id, path) {
        let storage = new Storage(path);
        this.stream = storage.writableStream(id);
    }

    saveInitializationVector(iv) {
        this.stream.write(iv);
    }

    saveMetadata(metadata) {
        const len = metadata.length;

        let buffer = Buffer.alloc(2);
        buffer.writeUInt16BE(len, 0);

        this.stream.write(buffer);
        this.stream.write(metadata);
    }

    saveChunk(chunk) {
        this.stream.write(chunk);
    }
};
