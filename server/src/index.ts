import cors from "cors";
import { CronJob } from "cron";
import express from "express";
import expressWs from "express-ws";
import path from "path";
import Config from "./config";
import random from "./routes/random";
import range from "./routes/range";
import upload from "./routes/upload";
import uploadInit from "./routes/uploadInit";
import ws from "./routes/ws";
import { Storage } from "./storage";

const app = expressWs(express()).app;

app.use(cors());

app.get("/api/random/:size", random);

app.get("/api/range/:id", range);

app.post("/api/upload", uploadInit);

app.post("/api/upload/:id", express.raw({ limit: "1mb" }), upload);

app.ws("/api/upload", ws);

if (Config.environment === "production") {
    // merge server side and client side you
    app.use(
        "/dist",
        express.static(path.join(__dirname, "../../client/dist/"))
    );

    // http -> https
    app.enable("trust proxy");

    app.use((req, res, next) => {
        if (req.secure) {
            next();
        } else {
            res.redirect("https://" + req.headers.host + req.url);
        }
    });

    // favicon.ico
    app.get("/favicon.ico", (req, res) => {
        res.status(200).sendFile(
            path.join(__dirname, "../src/assets/favicon.ico")
        );
    });

    // every request, which doesn't fit to server api is sent to client router
    app.get("*", (req, res) => {
        res.status(200).sendFile(path.join(__dirname, "../../index.html"));
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

const job = new CronJob(
    "0 * * * *",
    async () => {
        const st = new Storage();
        await st.removeAllFilesOlderThan(Config.expiredAfterDays);
    },
    null,
    true
);
job.start();
