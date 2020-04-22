import AuthDropbox from "./authDropbox";
import ISender from "./interfaces/iSender";
import { StorageType } from "./interfaces/storageType";
import { SenderDropbox, SenderServer } from "./sender";
import UploadSource from "./uploadSource";

export default class UploadFile {
    private readonly sender: ISender;
    private readonly source: UploadSource;

    public constructor(
        file: File,
        opts: { sender: StorageType; data?: any },
        progress: (u: number) => any,
        password?: string
    ) {
        this.source = new UploadSource(file, progress, password);

        switch (opts.sender) {
            case "server":
                this.sender = new SenderServer();
                break;
            case "dropbox":
                if (!opts.data) {
                    throw new Error("Data is required");
                }

                this.sender = new SenderDropbox(opts.data);
                break;
            default:
                throw new Error("Sender is not correct");
        }
    }

    public async upload(): Promise<{ id: string; key: string }> {
        return await this.sender.send(this.source);
    }

    public cancel(): void {
        this.sender.cancel();
    }
}
