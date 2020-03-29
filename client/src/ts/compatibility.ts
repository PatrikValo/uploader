import * as Bowser from "bowser";
import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import {
    TransformStream as TrS,
    WritableStream as WrS
} from "web-streams-polyfill/ponyfill";

class BaseCompatibility {
    /**
     * It verifies compatibility of browser with application. If some components
     * are missing, they are replace by alternative implementation.
     *
     * @return True - if browser is compatible
     *         False - otherwise
     */
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
            return (
                !!window &&
                !!window.navigator &&
                !!window.navigator.userAgent &&
                !!window.File &&
                !!window.Blob &&
                !!window.crypto &&
                !!window.crypto.subtle &&
                !!Uint8Array &&
                !!Promise
            );
        } catch (e) {
            return false;
        }
    }
}

export class DownloadCompatibility {
    /**
     * It verifies availability tools in browser, which are needed for part of
     * application, which is responsible for downloading.
     * If some components are missing, they are replace by alternative implementation.
     *
     * @return True - if browser is compatible
     *         False - otherwise
     */
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

    /**
     * It verifies, if is necessary to download whole file to memory before it
     * is sent to user filesystem
     *
     * @return True - it doesn't support streamsaver
     *         False - it supports streamsaver
     */
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
    /**
     * It verifies availability tools in browser, which are needed for part of
     * application, which is responsible for uploading.
     *
     * @return True - if browser is compatible
     *         False - otherwise
     */
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
