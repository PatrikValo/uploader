import config from "./config";
export default class Limiter {
    private readonly size: number;

    public constructor(size?: number) {
        this.size = size || config.client.fileSizeLimit;
    }

    public validateFileSize(file: File): boolean {
        return file.size <= this.size;
    }
}
