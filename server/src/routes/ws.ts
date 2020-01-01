import express from "express";
import uuid from "uuid/v1";
import Ws from "ws";
import FileSaver from "../fileSaver";

// noinspection JSUnusedLocalSymbols
export default (ws: Ws, req: express.Request, next: express.NextFunction) => {
    const FILE_ID = uuid();
    const fileSaver = new FileSaver(FILE_ID);

    let iv = false;
    let flag = false;
    let salt = false;
    let metadata = false;
    let id = false;

    ws.send(JSON.stringify({ nextElement: "iv" }));

    ws.onmessage = async event => {
        // it can throw exception if saving operation went wrong caused by incorrect input from client
        try {
            if (iv && metadata && flag && salt) {
                if (event.data === "null") {
                    fileSaver.end();
                    id = true;
                    return ws.send(JSON.stringify({ id: FILE_ID }));
                }

                await fileSaver.saveChunk(event.data as Buffer);
                return ws.send(JSON.stringify({ status: 200 }));
            }

            if (!iv) {
                iv = true;
                await fileSaver.saveInitializationVector(event.data as Buffer);
                return ws.send(JSON.stringify({ nextElement: "flags" }));
            }

            if (!flag) {
                flag = true;
                await fileSaver.saveFlags(event.data as Buffer);

                return ws.send(JSON.stringify({ nextElement: "salt" }));
            }

            if (!salt) {
                salt = true;
                await fileSaver.saveSalt(event.data as Buffer);
                return ws.send(JSON.stringify({ nextElement: "metadata" }));
            }

            if (!metadata) {
                metadata = true;
                await fileSaver.saveMetadata(event.data as Buffer);
                return ws.send(JSON.stringify({ status: 200 }));
            }
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
