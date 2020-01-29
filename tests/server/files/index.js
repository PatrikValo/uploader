const pathObj = require("path");
const fs = require("fs");
const path = pathObj.join(__dirname);

const iv = [];
for (let i = 0; i < 32; i++) {
    iv.push(i);
}
const flags = [1];
const salt = [];
for (let i = 65; i < 32 + 65; i++) {
    salt.push(i);
}
const metadata = [200, 100, 33, 24, 15, 98];
const sizeMet = Buffer.alloc(2);
sizeMet.writeUInt16BE(metadata.length, 0);
const firstChunk = [];
for (let i = 0; i < 64 * 1024; i++) {
    firstChunk.push(15);
}

const secondChunk = [251, 200, 198, 1, 2, 65, 0, 66];

const stream = fs.createWriteStream(pathObj.join(path, "correctFile"));
stream.write(Buffer.from(iv));
stream.write(Buffer.from(flags));
stream.write(Buffer.from(salt));
stream.write(Buffer.from(sizeMet));
stream.write(Buffer.from(metadata));
stream.write(Buffer.from(firstChunk));
stream.write(Buffer.from(secondChunk));
stream.end();
