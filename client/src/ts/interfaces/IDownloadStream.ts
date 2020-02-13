/**
 * done - true, if there is no chunk for reading, false otherwise
 * value - empty Uint8Array if done is true, not empty Uint8Array otherwise
 */
export interface IDownloadStreamReturnValue {
    done: boolean;
    value: Uint8Array;
}

export interface IDownloadStream {
    /**
     * Async method for downloading one chunk of file. This method is called
     * repeatedly until it returns object, which contains positive done property.
     * @return Promise, which contains object implements
     * IDownloadStreamReturnValue interface
     * @throws Error object, if something went wrong
     */
    read(): Promise<IDownloadStreamReturnValue>;
}
