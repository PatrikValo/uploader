module.exports = {
    port: process.env.PORT || 9998,
    environment: process.env.NODE_ENV || "development",
    ivSize: 32,
    flagsSize: 1,
    saltSize: 32,
    chunkSize: 64 * 1024,
    spacePath: __dirname + "/files"
};
