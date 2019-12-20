import * as Bowser from "bowser";
import Prom from "promise-polyfill";
import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import {
    TransformStream as TrS,
    WritableStream as WrS
} from "web-streams-polyfill/ponyfill";

class BaseCompatibility {
    public static isCompatible(): boolean {
        try {
            if (!TextEncoder || !TextDecoder) {
                (TextEncoder as any) = Encoder;
                (TextDecoder as any) = Decoder;
            }
        } catch (e) {
            (window as any).TextEncoder = Encoder;
            (window as any).TextDecoder = Decoder;
        }

        try {
            if (!!Promise) {
                (Promise as any) = Prom;
            }
        } catch (e) {
            (window as any).Promise = Prom;
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
        if (!BaseCompatibility.isCompatible()) {
            return false;
        }

        try {
            if (!WritableStream) {
                (WritableStream as any) = WrS;
            }
        } catch (e) {
            (window as any).WritableStream = WrS;
        }

        try {
            if (!TransformStream) {
                (TransformStream as any) = TrS;
            }
        } catch (e) {
            (window as any).TransformStream = TrS;
        }

        try {
            return !!XMLHttpRequest;
        } catch (e) {
            return false;
        }
    }

    public static blob(): boolean {
        const browser = Bowser.getParser(window.navigator.userAgent);
        const safari = browser.satisfies({
            safari: ">=0"
        });

        return (
            safari ||
            !(
                isSecureContext &&
                window.navigator.serviceWorker &&
                ReadableStream &&
                Response
            )
        );
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
