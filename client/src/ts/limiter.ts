import Config from "./config";
export default class Limiter {
    private readonly size: number;

    public constructor(size?: number) {
        this.size = size === undefined ? Config.client.fileSizeLimit : size;
    }

    public validateFileSize(size: number): boolean {
        return size <= this.size;
    }
}
