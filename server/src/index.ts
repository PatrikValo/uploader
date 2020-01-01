import express from "express";
import expressWs from "express-ws";
import path from "path";
import Config from "./config";
import download from "./routes/download";
import metadata from "./routes/metadata";
import random from "./routes/random";
import ws from "./routes/ws";

const app = expressWs(express()).app;

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

app.get("/api/random/:size", random);

app.get("/api/metadata/:id", metadata);

app.get("/api/download/:id/:chunk", download);

app.ws("/api/upload", ws);

if (Config.environment === "production") {
    // merge server side and client side to one app
    app.use("/dist", express.static(path.join(__dirname, "../client/dist/")));

    app.get("*", (req, res) => {
        res.status(200).sendFile(path.join(__dirname, "../index.html"));
    });
}

app.use((req, res, next) => {
    res.status(404).send("Not Found");
    next();
});

app.listen(Config.port, () =>
    // tslint:disable-next-line:no-console
    console.log(`Listening for port ${Config.port}...`)
);
