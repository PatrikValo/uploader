import * as Bowser from "bowser";

class BaseCompatibility {
    public static isCompatible(): boolean {
        return BaseCompatibility.compatible;
    }

    private static compatible: boolean =
        !!window &&
        !!window.navigator &&
        !!window.navigator.userAgent &&
        !!window.File &&
        !!window.Blob &&
        !!TextEncoder &&
        !!TextDecoder &&
        !!window.crypto &&
        !!window.crypto.subtle &&
        !!Promise;
}

export class DownloadCompatibility {
    public static isCompatible(): boolean {
        return DownloadCompatibility.compatible;
    }

    public static blob(): boolean {
        const browser = Bowser.getParser(window.navigator.userAgent);
        const safari = browser.satisfies({
            safari: ">=0"
        });

        return safari || !window.navigator.serviceWorker;
    }

    private static compatible =
        BaseCompatibility.isCompatible() && !!XMLHttpRequest;
}

export class UploadCompatibility {
    public static isCompatible(): boolean {
        return UploadCompatibility.compatible;
    }

    private static compatible =
        BaseCompatibility.isCompatible() &&
        !!window.FileReader &&
        !!window.FileList &&
        !!WebSocket;
}
