const Storage = require("./storage");
const config = require("./config");

module.exports = class FileSaver {
    constructor(id, path) {
        this.id = id;
        this.storage = new Storage(path);
        this.stream = this.storage.writableStream(id);
    }

    async saveInitializationVector(iv) {
        if (iv.length !== config.ivSize) {
            throw new Error("Length of IV is not correct");
        }

        await this.saveChunk(iv);
    }

    async saveMetadata(metadata) {
        const len = metadata.length;
        if (metadata.length > config.chunkSize) {
            throw new Error("Length of metadata is too long");
        }

        let buffer = Buffer.alloc(2);
        buffer.writeUInt16BE(len, 0);

        await this.saveChunk(buffer);
        await this.saveChunk(metadata);
    }

    async saveFlags(flags) {
        if (flags.length !== config.flagsSize) {
            throw new Error("Length of flags is not correct");
        }

        await this.saveChunk(flags);
    }

    async saveSalt(salt) {
        if (salt.length !== config.saltSize) {
            throw new Error("Length of salt is not correct");
        }

        await this.saveChunk(salt);
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
