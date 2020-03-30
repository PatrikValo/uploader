/**
 * For easy integration of any storage server into the download part of application,
 * the IReceiver interface must be implemented.
 */
export default interface IReceiver {
    /**
     * It downloads the chunk of file, whose first position in file is defined by
     * FROM param and last position is defined by TO param.
     * [from, to) interval
     * @param from - first position of chunk
     * @param to - last position of chunk
     * @return Promise with downloaded chunk
     */
    receive(from: number, to: number): Promise<Uint8Array>;
}
