class Server {
    public readonly host: string = "aploader.herokuapp.com";
    public readonly port: string = "443";
    public readonly protocol: string = "https";
}

class Client {
    public readonly host: string = "aploader.herokuapp.com";
    public readonly port: string = "443";
    public readonly protocol: string = "https";
    public readonly fileSizeLimit: number = 1024 * 1024 * 1024;
    public readonly chunkSize: number = 64 * 1024;
}

export default class Config {
    public static readonly server: Server = new Server();
    public static readonly client: Client = new Client();
}
