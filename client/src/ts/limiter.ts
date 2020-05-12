import Config from "./config";
export default class Limiter {
    private readonly size: number;

    public constructor(isDropbox: boolean) {
        const { fileSizeLimit, fileSizeLimitDropbox } = Config.client;
        this.size = isDropbox ? fileSizeLimitDropbox : fileSizeLimit;
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
