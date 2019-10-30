export default class DownloadMetadata {
    private readonly id: string;

    public constructor(id: string) {
        this.id = id;
    }

    public getInfo(): Promise<{ iv: Uint8Array; metadata: Uint8Array }> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = () => {
                if (xhr.status === 404) {
                    return reject();
                }

                if (xhr.response) {
                    const iv = new Uint8Array(xhr.response.iv.data);
                    const metadata = new Uint8Array(xhr.response.metadata.data);
                    return resolve({ iv, metadata });
                }

                return reject();
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.open("get", "http://localhost:9998/api/metadata/" + this.id);
            xhr.responseType = "json";
            xhr.send();
        });
    }
}
