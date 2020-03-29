/**
 * For easy integration of any storage server into the upload part of application,
 * the ISender interface must be implemented.
 */
export default interface ISender {
    /**
     * Async method for sending file
     * @param progress - function, which is called with size of chunk each time,
     * when new chunk is sent to server
     * @return Promise, which contains object with id of uploaded file and
     * key in exported format, which was used for encryption. If uploading of file
     * was stopped with cancel method, it returns object with empty id and empty key.
     */
    send(progress: (u: number) => any): Promise<{ id: string; key: string }>;

    /**
     * Method, which stop uploading of file
     */
    cancel(): void;
}
