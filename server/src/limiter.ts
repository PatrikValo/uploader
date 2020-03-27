import Config from "./config";

export default class Limiter {
    private readonly size: number;
    private currentSize: number;

    public constructor() {
        this.size = Config.fileSizeLimit;
        this.currentSize = 0;
    }

    /**
     * It verifies if size fulfils max limit of file size
     *
     * @param size
     * @throws Error object - if size limit is exceeded
     */
    public increase(size: number): void {
        this.currentSize += size;
        if (this.currentSize > this.size) {
            throw new Error("Size limit is exceeded");
        }
    }
}
