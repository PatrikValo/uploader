import Config from "./config";
import IReceiver from "./interfaces/iReceiver";
import { StorageType } from "./interfaces/storageType";
import Metadata from "./metadata";
import { ReceiverDropbox, ReceiverServer } from "./receiver";

export default class DownloadMetadataSource {
    private readonly receiver: IReceiver;

    public constructor(id: string, receiver: StorageType) {
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
     * It download additional data (iv, flag
     * for UI, salt, length of metadata) of file, which is stored
     * on receiver storage.
     *
     * @return {iv, flag, salt, len}
     */
    public async downloadAdditionalData(): Promise<{
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
     * It downloads raw metadata of file from receiver storage.
     *
     * @param len - len of encrypted metadata
     * @return Promise with metadata
     */
    public async downloadMetadata(len: number): Promise<Uint8Array> {
        const { ivLength, saltLength } = Config.cipher;
        const start = ivLength + 1 + saltLength + 2;
        return this.receiver.receive(start, start + len);
    }
}
