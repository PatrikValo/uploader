import Config from "./config";
export default class Limiter {
    private readonly size: number;

    public constructor(isDropbox: boolean) {
        this.size = isDropbox
            ? Config.client.fileSizeLimitDropbox
            : Config.client.fileSizeLimit;
    }

    public validateFileSize(size: number): boolean {
        return size <= this.size;
    }
}
