const FileReader = require("../fileReader");

module.exports = async (req, res) => {
    const id = req.params.id;

    try {
        let fileReader = new FileReader(id);
        let readableStream = await fileReader.readableStream();

        readableStream.pipe(res);
    } catch (e) {
        return res.status(404).send();
    }
};
