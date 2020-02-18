import Config from "./config";
export default class Limiter {
    private readonly size: number;

    public constructor(isDropbox: boolean) {
        this.size = isDropbox
            ? Config.client.fileSizeLimitDropbox
            : Config.client.fileSizeLimit;
    }

    /**
     * It verifies if size fulfils max limit of file size
     *
     * @param size
     * @return True - if size param fulfills max limit of file size
     *         False - otherwise
     */
    public validateFileSize(size: number): boolean {
        return size <= this.size;
    }
}
