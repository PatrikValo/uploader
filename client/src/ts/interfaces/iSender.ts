/**
 * For easy integration of any storage server into the upload part of application,
 * the ISender interface must be implemented.
 */
export default interface ISender {
    /**
     * Async method for sending UploadSource (file), which is given as param in constructor
     * @param progress - function, which is called with size of chunk each time,
     * when new chunk is sent to server
     * @return Promise, which contains object with id of uploaded file and
     * key in base64 format, which will be part of URL. If uploading of file
     * was stopped with cancel method, it returns object with empty id and empty key.
     */
    send(progress: (u: number) => any): Promise<{ id: string; key: string }>;

    /**
     * Method, which stop uploading of file
     */
    cancel(): void;
}
