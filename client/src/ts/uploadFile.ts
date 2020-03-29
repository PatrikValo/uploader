import AuthDropbox from "./authDropbox";
import ISender from "./interfaces/ISender";
import { SenderDropbox, SenderServer } from "./sender";
import UploadSource from "./uploadSource";

type SenderType = "server" | "dropbox";

export default class UploadFile {
    private readonly sender: ISender;

    constructor(
        file: File,
        opts: { sender: "server" } | { sender: "dropbox"; data: AuthDropbox },
        password?: string
    );

    public constructor(
        file: File,
        opts: { sender: SenderType; data?: any },
        password?: string
    ) {
        const sourceStream = new UploadSource(file, password);
        switch (opts.sender) {
            case "server":
                this.sender = new SenderServer(sourceStream);
                break;
            case "dropbox":
                this.sender = new SenderDropbox(sourceStream, opts.data);
                break;
            default:
                throw new Error("Sender is not correct");
        }
    }

    public async upload(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }> {
        return await this.sender.send(progress);
    }

    public cancel(): void {
        this.sender.cancel();
    }
}
