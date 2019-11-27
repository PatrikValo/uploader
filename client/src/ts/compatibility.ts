import * as Bowser from "bowser";
import Prom from "promise-polyfill";
import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";

class BaseCompatibility {
    public static isCompatible(): boolean {
        try {
            if (!TextEncoder || !TextDecoder) {
                (TextEncoder as any) = Encoder;
                (TextDecoder as any) = Decoder;
            }
        } catch (e) {
            (TextEncoder as any) = Encoder;
            (TextDecoder as any) = Decoder;
        }

        try {
            if (!!Promise) {
                (Promise as any) = Prom;
            }
        } catch (e) {
            (Promise as any) = Prom;
        }

        try {
            return (
                !!window &&
                !!window.navigator &&
                !!window.navigator.userAgent &&
                !!window.File &&
                !!window.Blob &&
                !!window.crypto &&
                !!window.crypto.subtle &&
                !!Uint8Array
            );
        } catch (e) {
            return false;
        }
    }
}

export class DownloadCompatibility {
    public static isCompatible(): boolean {
        try {
            return BaseCompatibility.isCompatible() && !!XMLHttpRequest;
        } catch (e) {
            return false;
        }
    }

    public static blob(): boolean {
        const browser = Bowser.getParser(window.navigator.userAgent);
        const safari = browser.satisfies({
            safari: ">=0"
        });

        return safari || !window.navigator.serviceWorker;
    }
}

export class UploadCompatibility {
    public static isCompatible(): boolean {
        try {
            return (
                BaseCompatibility.isCompatible() &&
                !!window.FileReader &&
                !!window.FileList &&
                !!WebSocket
            );
        } catch (e) {
            return false;
        }
    }
}
