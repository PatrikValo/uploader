const FileReader = require("../fileReader");

module.exports = async (req, res) => {
    const id = req.params.id;
    const chunkNumber = req.params.chunk;

    if (!chunkNumber || !id) {
        return res.status(400).send();
    }

    let fileReader;
    try {
        // it can throw error when file not exist
        fileReader = new FileReader(id);
    } catch (e) {
        return res.status(404).send();
    }

    try {
        // it can throw error cause by reading from file
        const chunk = await fileReader.chunk(chunkNumber);
        return res.status(200).send(chunk);
    } catch (e) {
        return res.status(500).send();
    }
};
