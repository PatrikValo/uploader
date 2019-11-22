import Config from "./config";

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
    // server
    public static readonly server = {
        websocketUrl(path?: string): string {
            const protocol = Config.server.protocol;
            const host = Config.server.host;
            const port = Config.server.port;

            let url = protocol === "http" ? "ws" : "wss";
            url += "://" + basicUrl(host, port, path);
            return url;
        },
        classicUrl(path?: string): string {
            const protocol = Config.server.protocol;
            const host = Config.server.host;
            const port = Config.server.port;

            return protocol + "://" + basicUrl(host, port, path);
        }
    };

    // client
    public static buildUrl(base: string, id: string, key: string): string {
        const protocol = Config.client.protocol;
        const host = Config.client.host;
        const port = Config.client.port;

        const path = Utils.buildPath(base, id, key);
        return protocol + "://" + basicUrl(host, port, path);
    }

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

    public static Uint8ArrayToBase64(buff: Uint8Array): string {
        const array = [].slice.call(buff);
        const str = btoa(String.fromCharCode.apply(null, array));
        return str.replace(/\//g, "_").replace(/[+]/g, "-");
    }

    public static stringToUint8Array(str: string): Uint8Array {
        const encoder: TextEncoder = new TextEncoder();
        return encoder.encode(str);
    }

    public static Uint8ArrayToString(uint: Uint8Array): string {
        const decoder: TextDecoder = new TextDecoder();
        return decoder.decode(uint);
    }
}
