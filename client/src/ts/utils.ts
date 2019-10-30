import Config from "./config";

function basicUrl(host: string, port?: string, path?: string): string {
    let url = host;

    if (port) {
        url += ":" + port;
    }

    if (path) {
        url += path;
    }

    return url;
}

export default class Utils {
    // server
    public static readonly server = {
        websocketUrl(path?: string): string {
            const protocol = Config.server.protocol;
            const host = Config.server.host;
            const port = Config.server.port;

            let url = protocol === "http" ? "ws" : "wss";
            url += "://" + basicUrl(host, port, path);
            return url;
        },
        classicUrl(path?: string): string {
            const protocol = Config.server.protocol;
            const host = Config.server.host;
            const port = Config.server.port;

            return protocol + "://" + basicUrl(host, port, path);
        }
    };

    // client
    public static buildUrl(id: string, key: string): string {
        const protocol = Config.client.protocol;
        const host = Config.client.host;
        const port = Config.client.port;

        const path = "/download/" + id + "#" + key;
        return protocol + "://" + basicUrl(host, port, path);
    }
}
