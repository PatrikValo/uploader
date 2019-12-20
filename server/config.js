module.exports = {
    port: process.env.PORT || 9998,
    environment: process.env.NODE_ENV || "development",
    ivSize: 16,
    flagsSize: 8,
    saltSize: 16,
    chunkSize: 64 * 1024,
    spacePath: __dirname + "/files"
};
