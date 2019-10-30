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

class Server {
    public readonly host: string = "localhost";
    public readonly port: string = "9998";
    public readonly protocol: string = "http";

    public websocketUrl(path?: string): string {
        let url = this.protocol === "http" ? "ws" : "wss";
        url += "://" + basicUrl(this.host, this.port, path);
        return url;
    }

    public classicUrl(path?: string): string {
        return this.protocol + "://" + basicUrl(this.host, this.port, path);
    }
}

class Client {
    public readonly host: string = "localhost";
    public readonly port: string = "8080";
    public readonly protocol: string = "http";
    public readonly fileSizeLimit: number = 1073741824;

    // TODO utils object
    public createUrl(id: string, key: string): string {
        const path = "/download/" + id + "#" + key;
        return this.protocol + "://" + basicUrl(this.host, this.port, path);
    }
}

export default class Config {
    public static readonly server: Server = new Server();
    public static readonly client: Client = new Client();
}
