import Config from "./config";

/**
 * It joins parameters of function to the url without protocol part
 *
 * host(:port)(/path)
 * @param host
 * @param port
 * @param path
 * @return url without protocol identifier
 */
function basicUrl(host: string, port?: string, path?: string): string {
    let url = host;

    if (port) {
        url += ":" + port;
    }

    if (path) {
        path = path.charAt(0) === "/" ? path : "/" + path;
        url += path;
    }

    return url;
}

export default class Utils {
    /**
     * It creates url for websocket connection to server with path
     *
     * ws(s)://host(:port)(/path)
     * @param path
     * @return websocket url
     */
    public static serverWebsocketUrl(path?: string): string {
        const protocol = Config.server.protocol;
        const host = Config.server.host;
        const port = Config.server.port;

        let url = protocol === "http" ? "ws" : "wss";
        url += "://" + basicUrl(host, port, path);
        return url;
    }

    /**
     * It creates server url with path
     *
     * http(s)://host(:port)(/path)
     * @param path
     * @return server url
     */
    public static serverClassicUrl(path?: string): string {
        const protocol = Config.server.protocol;
        const host = Config.server.host;
        const port = Config.server.port;

        return protocol + "://" + basicUrl(host, port, path);
    }

    /**
     * It creates client url with path. Path is created from parameters.
     *
     * http(s)://host(:port)/base(/id)(#key)
     * @param base
     * @param id
     * @param key
     * @return client url
     */
    public static buildUrl(base: string, id: string, key: string): string {
        const protocol = Config.client.protocol;
        const host = Config.client.host;
        const port = Config.client.port;

        const path = Utils.buildPath(base, id, key);
        return protocol + "://" + basicUrl(host, port, path);
    }

    /**
     * It creates path of url correctly. This function is created
     * mainly for creating /base/id#key format path, but it can be used
     * in other cases.
     *
     * /(base)(/id)(#id)
     * @param base
     * @param id
     * @param key
     * @return path part for url
     */
    public static buildPath(base: string, id: string, key: string): string {
        if (base) {
            base = "/" + base;
        }

        if (id) {
            id = "/" + id;
        }

        let path = `${base}${id}`;

        if (key) {
            if (key.charAt(0) === "#") {
                path += key;
            } else {
                path += "#" + key;
            }
        }

        if (path.charAt(0) === "/") {
            return path;
        }

        return "/" + path;
    }

    /**
     * It converts base64 format to Uint8Array
     *
     * @param str - string in base64 format
     * @return Uint8Array corresponds to str param
     */
    public static base64toUint8Array(str: string): Uint8Array {
        const replaced = str.replace(/_/g, "/").replace(/-/g, "+");
        return new Uint8Array(
            atob(replaced)
                .split("")
                .map((c: string) => {
                    return c.charCodeAt(0);
                })
        );
    }

    /**
     * It converts Uint8Array to base64 format
     *
     * @param uint
     * @return string corresponds to uint param
     */
    public static Uint8ArrayToBase64(uint: Uint8Array): string {
        const array = [].slice.call(uint);
        const str = btoa(String.fromCharCode.apply(null, array));
        return str.replace(/\//g, "_").replace(/[+]/g, "-");
    }

    /**
     * It converts string to Uint8Array
     *
     * @param str
     * @return Uint8Array corresponds to str param
     */
    public static stringToUint8Array(str: string): Uint8Array {
        const encoder: TextEncoder = new TextEncoder();
        return encoder.encode(str);
    }

    /**
     * It converts Uint8Array to string
     *
     * @param uint
     * @return string corresponds to uint param
     */
    public static Uint8ArrayToString(uint: Uint8Array): string {
        const decoder: TextDecoder = new TextDecoder();
        return decoder.decode(uint);
    }

    /**
     * It makes GET request
     *
     * @param url - destination where is sent the request
     * @param headers - array of objects with header name and value of an HTTP request header
     * @param responseType - defines the response type
     * @return Promise with result of request
     * @exception Error object - if something went wrong
     */
    public static getRequest(
        url: string,
        headers: Array<{ header: string; value: string }>,
        responseType: XMLHttpRequestResponseType
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onloadend = async () => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    return reject(new Error(String(xhr.status)));
                }

                return resolve(xhr.response);
            };

            xhr.onabort = () => {
                return reject(new Error("The request was aborted"));
            };

            xhr.onerror = () => {
                return reject(
                    new Error("An error occurred during the request")
                );
            };

            xhr.open("get", url, true);

            headers.forEach(value => {
                xhr.setRequestHeader(value.header, value.value);
            });
            // IMPORTANT, it can caused problems without this header
            xhr.setRequestHeader("Cache-Control", "no-cache");

            xhr.responseType = responseType;
            xhr.send();
        });
    }
}
