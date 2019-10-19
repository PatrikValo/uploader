module.exports = (req, res) => {
    res.status(200).send("/api/download/" + req.params.id);
};
