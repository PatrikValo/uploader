const Storage = require("./storage");
const config = require("./config");

const lengthMetadata = async function(fd, storage) {
    const length = await storage.read(fd, config.ivSize, config.ivSize + 1);
    return length.readUInt16BE();
};

module.exports = class FileReader {
    constructor(id, path) {
        this.id = id;
        this.storage = new Storage(path);
        if (!this.storage.exist(id)) {
            throw new Error("No such file or directory");
        }
    }

    async initializationVector() {
        const fd = this.storage.open(this.id);
        const iv = await this.storage.read(fd, 0, config.ivSize - 1);
        this.storage.close(fd);
        return iv;
    }

    async metadata() {
        const fd = this.storage.open(this.id);
        const length = await lengthMetadata(fd, this.storage);

        const metadata = await this.storage.read(
            fd,
            config.ivSize + 2,
            config.ivSize + 1 + length
        );
        this.storage.close(fd);
        return metadata;
    }

    async chunk(chunkNumber) {
        const fd = this.storage.open(this.id);
        const length = await lengthMetadata(fd, this.storage);
        const start = config.ivSize + 2 + length;

        const chunk = await this.storage.readChunk(fd, chunkNumber, start);

        this.storage.close(fd);
        return chunk;
    }

    async readableStream() {
        const fd = this.storage.open(this.id);
        const length = await lengthMetadata(fd, this.storage);
        this.storage.close(fd);

        const start = config.ivSize + 2 + length;
        return this.storage.readableStream(this.id, start);
    }
};
