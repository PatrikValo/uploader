import express from "express";
import FileReader from "../fileReader";

export default async (req: express.Request, res: express.Response) => {
    if (!req.params.chunk || !req.params.id) {
        return res.status(400).send();
    }

    const id = req.params.id;
    const chunkNumber = +req.params.chunk;

    try {
        const fileReader = new FileReader(id);
        const chunk = await fileReader.chunk(chunkNumber);
        return res.status(200).send(chunk);
    } catch (e) {
        return res.status(404).send();
    }
};
