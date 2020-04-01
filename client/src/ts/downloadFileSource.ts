import Config from "./config";
import IReceiver from "./interfaces/iReceiver";
import { StorageType } from "./interfaces/storageType";
import { ReceiverDropbox, ReceiverServer } from "./receiver";

export default class DownloadFileSource {
    private readonly receiver: IReceiver;
    private readonly size: number;
    private startFrom: number;

    public constructor(
        id: string,
        receiver: StorageType,
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

        this.size = encryptedSize;
        this.startFrom = startFrom;
    }

    /**
     * Async method for downloading one chunk of file.
     * This method is called repeatedly until it returns null.
     * @return Null if there is nothing to download, otherwise
     * object which contains data of chunk and information if current
     * chunk is last
     */
    public async downloadChunk(): Promise<{
        value: Uint8Array;
        last: boolean;
    } | null> {
        const start = this.startFrom;
        if (start >= this.size) {
            return null;
        }

        let end = start + Config.client.chunkSize;
        let last = false;

        if (end >= this.size || this.size - end < Config.cipher.authTagLength) {
            last = true;
            end = this.size;
        }

        const value = await this.receiver.receive(start, end);
        this.startFrom = end;
        return { value, last };
    }
}
