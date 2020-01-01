import express from "express";
import FileReader from "../fileReader";

export default async (req: express.Request, res: express.Response) => {
    try {
        const fileReader = new FileReader(req.params.id);

        const iv = await fileReader.initializationVector();
        const flags = await fileReader.flags();
        const salt = await fileReader.salt();
        const metadata = await fileReader.metadata();

        const result = {
            flags,
            iv,
            metadata,
            salt
        };

        return res.status(200).send(JSON.stringify(result));
    } catch (e) {
        return res.status(404).send();
    }
};
