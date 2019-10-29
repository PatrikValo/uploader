export default class Config {
    public static readonly server = {
        protocol: "http",
        host: "localhost",
        port: "9998"
    };

    public static readonly constrains = {
        file: {
            sizeLimit: 1073741824
        }
    };

    private static urlWithoutProtocol(path?: string): string {
        const host = Config.server.host;
        const port = Config.server.port;
        let url = host;

        if (port) {
            url += ":" + port;
        }

        if (path) {
            url += path;
        }

        return url;
    }

    public static classicUrl(path?: string): string {
        const protocol = Config.server.protocol;

        return protocol + "://" + Config.urlWithoutProtocol(path);
    }

    public static websocketUrl(path?: string): string {
        const protocol = Config.server.protocol;

        let url = protocol == "http" ? "ws" : "wss";
        url += "://" + Config.urlWithoutProtocol(path);
        return url;
    }
}
