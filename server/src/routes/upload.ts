import express from "express";
import FileSaver from "../fileSaver";

export default async (req: express.Request, res: express.Response) => {
    try {
        const fileId = req.params.id;
        const fileSaver = new FileSaver(fileId);
        await fileSaver.saveChunk(req.body);
        await fileSaver.end();
        res.status(200).send();
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
};
