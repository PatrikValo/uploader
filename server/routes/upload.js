module.exports = (req, res) => {
    console.log(req.body);
    return res.status(200).send("/api/upload");
};
