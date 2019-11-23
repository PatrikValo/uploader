module.exports = {
    port: process.env.OPENSHIFT_NODEJS_PORT || 9998,
    ivSize: 16,
    chunkSize: 64 * 1024,
    spacePath: __dirname + "/files"
};
