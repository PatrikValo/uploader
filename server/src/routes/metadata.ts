import express from "express";
import { Ranges, Result } from "range-parser";
import FileReader from "../fileReader";

export default async (req: express.Request, res: express.Response) => {
    let fileReader: FileReader | null = null;
    try {
        fileReader = new FileReader(req.params.id);
        const range: Ranges | Result = req.range(await fileReader.size());

        if (range !== -1 && range !== -2) {
            if (range.length === 1) {
                const start = range[0].start;
                const end = range[0].end;
                const result = await fileReader.metadata(start, end);

                return res.status(200).send(result);
            }
        }

        return res.status(400).send();
    } catch (e) {
        return res.status(404).send();
    } finally {
        if (fileReader) {
            await fileReader.close();
        }
    }
};
