import Config from "./config";
import IReceiver from "./interfaces/IReceiver";
import Metadata from "./metadata";
import { ReceiverDropbox, ReceiverServer } from "./receiver";

type ReceiverType = "server" | "dropbox";

export class DownloadMetadataSource {
    private readonly receiver: IReceiver;

    public constructor(id: string, receiver: ReceiverType) {
        switch (receiver) {
            case "server":
                this.receiver = new ReceiverServer(id);
                break;
            case "dropbox":
                this.receiver = new ReceiverDropbox(id);
                break;
            default:
                throw new Error("Receiver is not correct");
        }
    }

    /**
     * Download aux data (iv, flag
     * for UI, salt, length of metadata) of file
     * @return {iv, flag, salt, len}
     * @exception Error - if something went wrong
     */
    public async downloadPlainData(): Promise<{
        iv: Uint8Array;
        flag: Uint8Array;
        salt: Uint8Array;
        len: number;
    }> {
        const { ivLength, saltLength } = Config.cipher;
        const end = ivLength + 1 + saltLength + 2;
        const result = await this.receiver.receive(0, end);
        const iv = result.slice(0, ivLength);
        const flag = result.slice(ivLength, ivLength + 1);
        const salt = result.slice(ivLength + 1, ivLength + 1 + saltLength);
        const len = Metadata.lengthToNumber(result.slice(-2));
        return { iv, flag, salt, len };
    }

    /**
     * It downloads metadata of file
     * @param len - len of encrypted metadata
     * @return Promise with metadata
     */
    public async downloadMetadata(len: number): Promise<Uint8Array> {
        const { ivLength, saltLength } = Config.cipher;
        const start = ivLength + 1 + saltLength + 2;
        return this.receiver.receive(start, start + len);
    }
}

export class DownloadFileSource {
    private readonly receiver: IReceiver;
    private readonly encryptedSize: number;
    private startFrom: number;

    public constructor(
        id: string,
        receiver: ReceiverType,
        startFrom: number,
        encryptedSize: number
    ) {
        switch (receiver) {
            case "server":
                this.receiver = new ReceiverServer(id);
                break;
            case "dropbox":
                this.receiver = new ReceiverDropbox(id);
                break;
            default:
                throw new Error("Receiver is not correct");
        }

        this.encryptedSize = encryptedSize;
        this.startFrom = startFrom;
    }

    /**
     * Async method for downloading one chunk of file. This method is called
     * repeatedly until it returns null.
     * @return Null if there is nothing to download, Object, which contains
     * data of chunk and "last" property, which provides information if
     * this chunk is last
     */
    public async downloadChunk(): Promise<{
        value: Uint8Array;
        last: boolean;
    } | null> {
        const start = this.startFrom;
        if (start >= this.encryptedSize) {
            return null;
        }
        let end = start + Config.client.chunkSize;
        let last = false;
        if (
            end >= this.encryptedSize ||
            this.encryptedSize - end < Config.cipher.authTagLength
        ) {
            last = true;
            end = this.encryptedSize;
        }
        const result = await this.receiver.receive(start, end);
        this.startFrom = end;
        return { value: result, last };
    }
}
