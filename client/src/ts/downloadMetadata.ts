import Metadata from "./metadata";
import Utils from "./utils";

interface IReturnValue {
    iv: Uint8Array;
    metadata: Uint8Array;
    password: {
        flag: boolean;
        salt: Uint8Array | null;
    };
}

export default class DownloadMetadata {
    private readonly id: string;

    public constructor(id: string) {
        this.id = id;
    }

    public download(): Promise<IReturnValue> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status !== 200) {
                    return reject(new Error(String(xhr.status)));
                }

                if (xhr.response) {
                    const iv = new Uint8Array(xhr.response.iv.data);
                    const metadata = new Uint8Array(xhr.response.metadata.data);
                    const flags = new Uint8Array(xhr.response.flags.data);
                    const salt = new Uint8Array(xhr.response.salt.data);
                    const password =
                        flags[0] === 1
                            ? {
                                  flag: true,
                                  salt
                              }
                            : {
                                  flag: false,
                                  salt: null
                              };

                    return resolve({ iv, metadata, password });
                }

                return reject(new Error("Response is empty"));
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            const url = Utils.server.classicUrl("/api/metadata/" + this.id);
            xhr.open("get", url);
            xhr.responseType = "json";
            xhr.send();
        });
    }
}
