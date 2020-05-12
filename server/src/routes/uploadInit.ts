import express from "express";
import uuid from "uuid/v1";
import FileSaver from "../fileSaver";

export default async (req: express.Request, res: express.Response) => {
    const fileId = uuid().replace(/-/g, "");
    const fileSaver = new FileSaver(fileId);
    await fileSaver.end();
    return res.status(200).send(JSON.stringify({ id: fileId }));
};
