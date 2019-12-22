const crypto = require("crypto");

module.exports = async (req, res) => {
    try {
        const size = Number(req.params.size);

        crypto.randomBytes(size, (err, buf) => {
            if (err) {
                return res.status(500).send();
            }

            return res.status(200).send(buf);
        });
    } catch (e) {
        return res.status(500).send();
    }
};
