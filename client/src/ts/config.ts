import { environment } from "../environment";

const production = environment.NODE_ENV === "production";

class CipherConfig {
    public readonly ivLength: number = 12;
    public readonly authTagLength: number = 16;
    public readonly saltLength: number = 16;
    public readonly keyLength: number = 16;
    public readonly deriveIterations: number = 10000;
}

class ServerConfig {
    public readonly host: string = environment.HOST || "localhost";
    public readonly port: string = production ? "" : "9998";
    public readonly protocol: string = production ? "https" : "http";
}

class ClientConfig {
    public readonly host: string = environment.HOST || "localhost";
    public readonly port: string = production ? "" : "8080";
    public readonly protocol: string = production ? "https" : "http";
    public readonly fileSizeLimit: number = 1024 * 1024 * 1024 * 5;
    public readonly fileSizeLimitDropbox: number = 1024 * 1024 * 1024 * 350;
    public readonly chunkSize: number = 64 * 1024;
    public readonly blobFileSizeLimit: number = 1024;
}

export default class Config {
    public static readonly server = new ServerConfig();
    public static readonly client = new ClientConfig();
    public static readonly cipher = new CipherConfig();
}
