const express = require("express");
const expressWs = require("express-ws");
const config = require("./config");
const download = require("./routes/download");
const metadata = require("./routes/metadata");
const ws = require("./routes/ws");
const upload = require("./routes/upload");

const app = express();
expressWs(app);

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

app.get("/api/metadata/:id", metadata);

app.get("/api/download/:id", download);

app.post("/api/upload", upload);

app.ws("/api/upload", ws);

app.use((req, res, next) => {
    res.status(404).send("Not Found");
    next();
});

app.listen(config.port, () =>
    console.log(`Listening for port ${config.port}...`)
);
