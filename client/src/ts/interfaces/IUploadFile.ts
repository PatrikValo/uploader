export default interface IUploadFile {
    /**
     * Async method for uploading file
     * @param progress - function, which is called with size of chunk each time,
     * when new chunk is sent
     * @return Promise, which contains object with id of uploaded file and
     * key in exported format, which was used for encrypting. It return object
     * with empty id and empty key, if uploading of file was stopped with
     * cancel method. It return object with empty key, if file is protected by
     * user's password.
     * @throws Error object, if something went wrong
     */
    upload(progress: (u: number) => any): Promise<{ id: string; key: string }>;

    /**
     * Method, which stop uploading of file
     */
    cancel(): void;

    /**
     * Getter for cancelled uploading
     * @return True, if uploading is cancelled. False otherwise.
     */
    isCanceled(): boolean;
}
