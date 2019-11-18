export interface IReadStreamReturnValue {
    done: boolean;
    value: Uint8Array;
}

export abstract class ReadStream {
    public abstract read(): Promise<IReadStreamReturnValue>;

    protected close(): IReadStreamReturnValue {
        return { done: true, value: new Uint8Array(0) };
    }

    protected enqueue(value: Uint8Array): IReadStreamReturnValue {
        return { done: false, value };
    }
}
