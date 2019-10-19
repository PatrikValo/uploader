const fs = require("fs");
const pathObj = require("path");

const path = pathObj.join(__dirname, "16bytesHeader");
const writable = fs.createWriteStream(path);

const header = Buffer.from([
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15
]);

const length = Buffer.from([0, 5]);

const metadata = Buffer.from([0, 1, 2, 3, 4]);

const body = Buffer.from([254, 128, 13, 0, 1, 0]);

writable.write(header);
writable.write(length);
writable.write(metadata);
writable.write(body);
