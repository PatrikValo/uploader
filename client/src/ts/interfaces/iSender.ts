import UploadSource from "../uploadSource";

/**
 * For easy integration of any storage server into the upload part of application,
 * the ISender interface must be implemented.
 */
export default interface ISender {
    /**
     * Async method for sending file, which is given as param
     * @param source - instance of UploadSource, which is source of all data
     * @return Promise, which contains object with id of uploaded file and
     * fragment in base64 format, which will be part of URL. If uploading of file
     * was stopped with cancel method, it returns object with empty id and empty fragment.
     */
    send(source: UploadSource): Promise<{ id: string; fragment: string }>;

    /**
     * Method, which stop uploading of file
     */
    cancel(): void;
}
