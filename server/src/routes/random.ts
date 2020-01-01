import crypto from "crypto";
import express from "express";

export default async (req: express.Request, res: express.Response) => {
    try {
        const size = Number(req.params.size);

        crypto.randomBytes(size, (err, buff: Buffer) => {
            if (err) {
                return res.status(500).send();
            }

            return res.status(200).send(buff);
        });
    } catch (e) {
        return res.status(500).send();
    }
};
