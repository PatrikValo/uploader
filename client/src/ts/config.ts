import { environment } from "../environment";

const production = environment.NODE_ENV === "production";

class CipherConfig {
    public readonly ivLength: number = 32;
    public readonly saltLength: number = 32;
    public readonly keyLength: number = 256;
    public readonly deriveIterations: number = 10000;
}

class Server {
    public readonly host: string = environment.HOST || "localhost";
    public readonly port: string = production ? "" : "9998";
    public readonly protocol: string = production ? "https" : "http";
}

class Client {
    public readonly host: string = environment.HOST || "localhost";
    public readonly port: string = production ? "" : "8080";
    public readonly protocol: string = production ? "https" : "http";
    public readonly fileSizeLimit: number = 1024 * 1024 * 1024;
    public readonly chunkSize: number = 64 * 1024;
    public readonly flagsSize: number = 1;
    public readonly blobFileSizeLimit: number = 1024 * 1024 * 250;
}

export default class Config {
    public static readonly server: Server = new Server();
    public static readonly client: Client = new Client();
    public static readonly cipher: CipherConfig = new CipherConfig();
}
