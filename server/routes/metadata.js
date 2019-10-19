const FileReader = require("../fileReader");

module.exports = async (req, res) => {
    try {
        let fileReader = new FileReader(req.params.id);

        const iv = await fileReader.initializationVector();
        const metadata = await fileReader.metadata();

        const result = {
            iv: iv,
            metadata: metadata
        };

        return res.status(200).send(JSON.stringify(result));
    } catch (e) {
        return res.status(404).send();
    }
};
