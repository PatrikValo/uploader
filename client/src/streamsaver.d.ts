declare module "streamsaver" {
    declare function createWriteStream(
        filename: string,
        options?: object,
        size?: number
    );
    declare let WritableStream: object;
}
