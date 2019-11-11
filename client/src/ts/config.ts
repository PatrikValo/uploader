class Server {
    public readonly host: string = "localhost";
    public readonly port: string = "9998";
    public readonly protocol: string = "http";
}

class Client {
    public readonly host: string = "localhost";
    public readonly port: string = "8080";
    public readonly protocol: string = "http";
    public readonly fileSizeLimit: number = 1024 * 1024 * 1024;
}

export default class Config {
    public static readonly server: Server = new Server();
    public static readonly client: Client = new Client();
}
