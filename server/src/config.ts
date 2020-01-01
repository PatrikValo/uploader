export default class Config {
    public static port: number = process.env.PORT ? +process.env.PORT : 9998;
    public static environment: string = process.env.NODE_ENV || "development";
    public static ivSize: number = 32;
    public static flagsSize: number = 1;
    public static saltSize: number = 32;
    public static chunkSize: number = 64 * 1024;
    public static spacePath: string = __dirname + "/files";
}
