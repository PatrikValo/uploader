export interface IDownloadStreamReturnValue {
    done: boolean;
    value: Uint8Array;
}

export interface IDownloadStream {
    read(): Promise<IDownloadStreamReturnValue>;
}
