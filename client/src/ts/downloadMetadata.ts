export default class DownloadMetadata {
    private readonly _id: string;

    public constructor(id: string) {
        this._id = id;
    }

    public getInfo(): Promise<{ iv: Uint8Array; metadata: Uint8Array }> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = function() {
                if (xhr.status == 404) {
                    return reject();
                }

                if (xhr.response) {
                    const iv = new Uint8Array(xhr.response.iv.data);
                    const metadata = new Uint8Array(xhr.response.metadata.data);
                    return resolve({ iv: iv, metadata: metadata });
                }

                return reject();
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.open("get", "http://localhost:9998/api/metadata/" + this._id);
            xhr.responseType = "json";
            xhr.send();
        });
    }
}
