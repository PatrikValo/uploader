const FileReader = require("../fileReader");

module.exports = async (req, res) => {
    try {
        let fileReader = new FileReader(req.params.id);

        const iv = await fileReader.initializationVector();
        const flags = await fileReader.flags();
        const salt = await fileReader.salt();
        const metadata = await fileReader.metadata();

        const result = {
            iv: iv,
            flags: flags,
            salt: salt,
            metadata: metadata
        };

        return res.status(200).send(JSON.stringify(result));
    } catch (e) {
        console.log(e);
        return res.status(404).send();
    }
};
