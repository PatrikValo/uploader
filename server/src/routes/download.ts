import express from "express";
import FileReader from "../fileReader";

export default async (req: express.Request, res: express.Response) => {
    if (
        !req.params.id ||
        !req.get("X-Chunk-Number") ||
        !req.get("X-Start-From")
    ) {
        return res.status(400).send();
    }

    const id = req.params.id;
    const chunkNumber = +req.get("X-Chunk-Number");
    const startFrom = +req.get("X-Start-From");

    let fileReader: FileReader | null = null;
    try {
        fileReader = new FileReader(id);
        const chunk = await fileReader.chunk(chunkNumber, startFrom);
        return res.status(206).send(chunk);
    } catch (e) {
        return res.status(404).send();
    } finally {
        if (fileReader) {
            await fileReader.close();
        }
    }
};
