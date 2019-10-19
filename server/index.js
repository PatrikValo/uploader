const express = require("express");
const config = require("./config");
const download = require("./routes/download");
const metadata = require("./routes/metadata");
const upload = require("./routes/upload");

const app = express();

app.get("/api/metadata/:id", metadata);

app.get("/api/download/:id", download);

app.post("/api/upload", upload);

app.use((req, res, next) => {
    res.status(404).send("Not Found");
    next();
});

app.listen(config.port, () =>
    console.log(`Listening for port ${config.port}...`)
);
