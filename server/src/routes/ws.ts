import express from "express";
import uuid from "uuid/v1";
import Ws from "ws";
import FileSaver from "../fileSaver";
import Limiter from "../limiter";

// noinspection JSUnusedLocalSymbols
export default (ws: Ws, req: express.Request, next: express.NextFunction) => {
    const FILE_ID = uuid().replace(/-/g, "");
    const fileSaver = new FileSaver(FILE_ID);
    let id = false;
    const limiter = new Limiter();

    ws.send(JSON.stringify({ status: 200 }));

    ws.onmessage = async event => {
        // it can throw exception if saving operation went wrong caused by incorrect input from client
        try {
            if (event.data === "null") {
                await fileSaver.end();
                id = true;
                return ws.send(JSON.stringify({ id: FILE_ID }));
            }

            await fileSaver.saveChunk(event.data as Buffer);
            limiter.increase((event.data as Buffer).length);
            return ws.send(JSON.stringify({ status: 200 }));
        } catch (e) {
            return ws.send(JSON.stringify({ status: 500 }));
        }
    };

    ws.onerror = async () => {
        await fileSaver.clear();
    };

    // delete file from storage
    ws.onclose = async () => {
        if (!id) {
            await fileSaver.clear();
        }
    };
};
