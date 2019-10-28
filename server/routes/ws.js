const FileSaver = require("../fileSaver");
module.exports = (ws, _req) => {
    const date = new Date();
    const FILE_ID = date.getTime() + "";
    const fileSaver = new FileSaver(FILE_ID);

    let iv = false;
    let metadata = false;
    let id = false;

    ws.send(JSON.stringify({ nextElement: "iv" }));

    ws.onmessage = event => {
        if (iv && metadata) {
            if (event.data === "null") {
                fileSaver.end();
                id = true;
                return ws.send(JSON.stringify({ id: FILE_ID }));
            }

            fileSaver.saveChunk(event.data);
            return ws.send(JSON.stringify({ status: 200 }));
        }

        if (!iv) {
            iv = true;
            fileSaver.saveChunk(event.data);
            return ws.send(JSON.stringify({ nextElement: "metadata" }));
        }

        metadata = true;
        fileSaver.saveMetadata(event.data);
        return ws.send(JSON.stringify({ status: 200 }));
    };

    // delete file from storage
    ws.onclose = event => {
        console.log("Websocket is closed");
        if (!id) {
            fileSaver.clear();
            console.log("\tID didn't send to client");
        }
    };
};
