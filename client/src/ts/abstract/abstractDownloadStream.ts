import {
    IDownloadStream,
    IDownloadStreamReturnValue
} from "../interfaces/IDownloadStream";

export default abstract class AbstractDownloadStream
    implements IDownloadStream {
    private chunkNumber: number = 0;

    public read(): Promise<IDownloadStreamReturnValue> {
        return new Promise(async (resolve, reject) => {
            try {
                const chunk = await this.downloadChunk(this.chunkNumber);
                this.chunkNumber++;

                if (!chunk) {
                    return resolve({ done: true, value: new Uint8Array(0) });
                }
                return resolve({ done: false, value: chunk });
            } catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * It downloads the chunk, whose position among chunks of file is given
     * by numberOfChunk param.
     *
     * @param numberOfChunk
     * @return null - there is nothing to download, because all data was downloaded
     *         data - otherwise
     * @exception Error - if something went wrong
     */
    protected abstract downloadChunk(
        numberOfChunk: number
    ): Promise<Uint8Array | null>;
}
