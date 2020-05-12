class Subtle {
    public digest(algorithm: string, data: Uint8Array): Promise<Uint8Array> {
        // sha-512
        const len = +algorithm.split("-")[1] / 8;
        return Promise.resolve(new Uint8Array(len).fill(8));
    }

    public importKey(
        format: string,
        data: Uint8Array,
        algorithm: string,
        exportable: boolean,
        a: string[]
    ): Promise<Uint8Array> {
        return new Promise(resolve => resolve(data));
    }

    public exportKey(format: string, data: Uint8Array): Promise<Uint8Array> {
        return Promise.resolve(data);
    }

    public deriveKey(
        algorithm: {
            hash: string;
            iterations: number;
            name: string;
            salt: Uint8Array;
        },
        key: Uint8Array,
        derivedKeyType: { name: string; length: number },
        extractable: boolean,
        p: string[]
    ): Promise<Uint8Array> {
        return Promise.resolve(
            new Uint8Array(derivedKeyType.length / 8).fill(25)
        );
    }
}

export default class Crypto {
    public subtle: Subtle = new Subtle();
    public getRandomValues(data: Uint8Array): Uint8Array {
        return data;
    }
}
