import express from "express";
import path from "path";
import { Storage } from "../storage";

export default async (req: express.Request, res: express.Response) => {
    try {
        const p = path.join(__dirname, "../../dist/files/");
        const storage = new Storage(p);

        if (storage.exist(req.params.id)) {
            return res.sendFile(path.join(p, req.params.id));
        }

        return res.status(404).send();
    } catch (e) {
        return res.status(404).send();
    }
};
