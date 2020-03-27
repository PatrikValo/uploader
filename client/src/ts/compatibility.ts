import * as Bowser from "bowser";
import {
    TextDecoder as Decoder,
    TextEncoder as Encoder
} from "text-encoding-shim";
import {
    TransformStream as TrS,
    WritableStream as WrS
} from "web-streams-polyfill/ponyfill";
import { AesGcmDecryptor, AesGcmEncryptor } from "../js/aesGcm";

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
            const a = new AesGcmEncryptor(
                new Uint8Array(16),
                new Uint8Array(16)
            );
            const res1 = a.update(new Uint8Array(16));
            const right1 = new Uint8Array([
                163,
                178,
                43,
                132,
                73,
                175,
                175,
                188,
                214,
                192,
                159,
                44,
                250,
                157,
                226,
                190
            ]);
            const res2 = a.update(new Uint8Array(16));
            const right2 = new Uint8Array([
                147,
                143,
                139,
                191,
                35,
                88,
                99,
                208,
                206,
                2,
                132,
                39,
                34,
                253,
                80,
                52
            ]);

            for (let i = 0; i < res1.length; i++) {
                if (res1[i] !== right1[i]) {
                    return false;
                }
                if (res2[i] !== right2[i]) {
                    return false;
                }
            }

            if (a.final().length !== 0) {
                return false;
            }

            const res3 = a.getAuthTag();
            const right3 = new Uint8Array([
                83,
                81,
                130,
                90,
                124,
                170,
                24,
                151,
                139,
                230,
                35,
                118,
                164,
                165,
                36,
                160
            ]);
            for (let i = 0; i < res3.length; i++) {
                if (res3[i] !== right3[i]) {
                    return false;
                }
            }
        } catch (e) {
            return false;
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
