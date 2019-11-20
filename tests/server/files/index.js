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

const path2 = pathObj.join(__dirname, "tooShortIv");
const writable2 = fs.createWriteStream(path2);

const header2 = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]);

const length2 = Buffer.from([0, 2]);

writable2.write(header2);
writable2.write(length2);

const path3 = pathObj.join(__dirname, "tooShortMetadata");
const writable3 = fs.createWriteStream(path3);

writable3.write(header);
writable3.write(length2);

const path4 = pathObj.join(__dirname, "noFileInformation");
const writable4 = fs.createWriteStream(path4);

writable4.write(header);
writable4.write(length);
writable4.write(metadata);
