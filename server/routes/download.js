const FileReader = require("../fileReader");

module.exports = async (req, res) => {
    const id = req.params.id;
    const chunkNumber = req.params.chunk;

    if (!chunkNumber || !id) {
        return res.status(400).send();
    }

    try {
        let fileReader = new FileReader(id);
        const chunk = await fileReader.chunk(chunkNumber);
        return res.status(200).send(chunk);
    } catch (e) {
        return res.status(404).send();
    }
};
