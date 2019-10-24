export default class MetadataFile {
    private readonly _id: string;

    public constructor(id: string) {
        this._id = id;
    }

    public getInfo() {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = function() {
                resolve(xhr.response);
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.open("get", "http://localhost:9998/api/metadata/" + this._id);
            xhr.responseType = "json";
            xhr.send();
        });
    }
}
