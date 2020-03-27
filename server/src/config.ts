export default class Config {
    public static readonly port: number = process.env.PORT
        ? +process.env.PORT
        : 9998;
    public static readonly environment: string =
        process.env.NODE_ENV || "development";
    public static readonly chunkSize: number = 64 * 1024;
    public static readonly fileSizeLimit: number = 1024 * 1024 * 1024 * 5;
    public static readonly spacePath: string = __dirname + "/files";
}
