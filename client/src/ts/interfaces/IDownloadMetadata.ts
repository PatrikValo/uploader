/**
 * iv - initialisation vector
 * metadata - encrypted metadata
 * password - {
 *     flag - true if file is protected by password, false otherwise
 *     salt - Uint8Array if flag is true, null otherwise
 * }
 * startFrom - first position of data of file on server
 */
export interface IReturnValue {
    iv: Uint8Array;
    metadata: Uint8Array;
    password: {
        flag: boolean;
        salt: Uint8Array | null;
    };
    startFrom: number;
}

export interface IDownloadMetadata {
    /**
     * Function, which download basic metadata (iv, encrypted metadata, flag
     * for UI, salt, start of data in file on server) of file
     * @return Object implements IReturnValue
     */
    download(): Promise<IReturnValue>;
}
