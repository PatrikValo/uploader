import Cipher from "./cipher";
import Metadata from "./metadata";
import Utils from "./utils";

export default class DownloadMetadata {
    private readonly id: string;
    private readonly key: string;

    public constructor(id: string, key: string) {
        this.id = id;
        this.key = key;
    }

    public download(): Promise<{ iv: Uint8Array; metadata: Metadata }> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status === 404) {
                    return reject();
                }

                if (xhr.response) {
                    try {
                        const iv = new Uint8Array(xhr.response.iv.data);
                        const mtd = new Uint8Array(xhr.response.metadata.data);
                        const metadata = await this.decrypt(iv, mtd);
                        return resolve({ iv, metadata });
                    } catch (e) {
                        // key is not correct because creation of metadata instance failed
                        return reject();
                    }
                }

                return reject();
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            const url = Utils.server.classicUrl("/api/metadata/" + this.id);
            xhr.open("get", url);
            xhr.responseType = "json";
            xhr.send();
        });
    }

    private decrypt(iv: Uint8Array, metadata: Uint8Array): Promise<Metadata> {
        const cipher = new Cipher(this.key, iv);
        return cipher.decryptMetadata(metadata);
    }
}
