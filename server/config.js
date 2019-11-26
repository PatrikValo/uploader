module.exports = {
    port: process.env.PORT || 9998,
    configuration: process.env.NODE_ENV || "development",
    ivSize: 16,
    chunkSize: 64 * 1024,
    spacePath: __dirname + "/files"
};
