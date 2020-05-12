import { Encryption } from "./cipher";
import Config from "./config";
import Metadata from "./metadata";
import Utils from "./utils";

export default class UploadSource {
    private encryptor: Encryption;
    private readonly fileStream: FileSource;
    private readonly metadata: Metadata;
    private readonly password: boolean;
    private readonly progress: (u: number) => any;
    private sendAdditionalData = false;
    private sendMetadata = false;
    private sendFile = false;

    public constructor(
        file: File,
        progress: (u: number) => any,
        password?: string
    ) {
        this.encryptor = new Encryption(password);
        this.fileStream = new FileSource(file);
        this.metadata = new Metadata(file);
        this.password = !!password;
        this.progress = progress;
    }

    /**
     * It exports the key, which must be saved to URL
     *
     * @return Promise with exported key
     */
    public fragment(): Promise<string> {
        return this.encryptor.getExportedFragment();
    }

    /**
     * Each time when this method is called, it returns part of file or
     * metadata (iv, flag, ..., file's metadata), which should be send to server next.
     *
     * @return null - there is nothing to read from file
     *         data - otherwise
     */
    public async getContent(): Promise<Uint8Array | null> {
        if (!this.sendAdditionalData) {
            this.sendAdditionalData = true;
            return this.createAdditionalData();
        }

        if (!this.sendMetadata) {
            this.sendMetadata = true;
            const metadata = await this.createMetadata();
            const newIV = metadata.slice(-Config.cipher.ivLength);
            this.encryptor.reset(newIV);
            return metadata;
        }

        if (!this.sendFile) {
            return this.createChunk();
        }

        return null;
    }

    /**
     * It creates additional data such iv, flag without length of
     * encrypted metadata. It joins these elements into one chunk.
     *
     * @return Promise with additional data
     */
    private async createAdditionalData(): Promise<Uint8Array> {
        const iv = await this.encryptor.getInitializationVector();
        const flagUint = new Uint8Array([this.password ? 1 : 0]);

        return Utils.concatUint8Arrays(iv, flagUint);
    }

    /**
     * It returns encrypted metadata with its length.
     *
     * @return Promise with length joins with metadata
     */
    private async createMetadata(): Promise<Uint8Array> {
        // encryption
        const metadata = await this.encryptor.encrypt(
            this.metadata.toUint8Array()
        );

        // tag
        const final = await this.encryptor.final();

        // length
        const length: Uint8Array = Metadata.lengthToUint8Array(
            metadata.length + final.length
        );

        return Utils.concatUint8Arrays(length, metadata, final);
    }

    /**
     * It returns encrypted chunk of file and progress is executed with length
     * of chunk before encryption. Method returns null, if there is nothing
     * to read from file.
     *
     * @return null - whole file was returned in previous callings of this method
     *         chunk - otherwise
     */
    private async createChunk(): Promise<Uint8Array> {
        const chunk = await this.fileStream.read();

        if (chunk) {
            this.progress(chunk.length); // users function
            return await this.encryptor.encrypt(chunk);
        }

        this.sendFile = true;
        return await this.encryptor.final();
    }
}

class FileSource {
    private file: File;
    private readonly size: number;
    private index: number = 0;
    private chunkSize: number = Config.client.chunkSize;

    public constructor(file: File) {
        this.file = file;
        this.size = file.size;
    }

    /**
     * It reads one chunk of file. Each time when this method is called, it returns
     * different chunk of file. If there is nothing to read, it returns null.
     *
     * @return Chunk or null
     */
    public read(): Promise<Uint8Array | null> {
        return new Promise((resolve, reject) => {
            if (this.index >= this.size) {
                return resolve(null);
            }

            const start = this.index;
            let end = this.index + this.chunkSize;

            if (end > this.size) {
                end = this.size;
            }

            this.index = end;

            const fileReader: FileReader = new FileReader();

            fileReader.onload = () => {
                return resolve(
                    new Uint8Array(fileReader.result as ArrayBuffer)
                );
            };

            fileReader.onerror = reject;

            const slice: Blob = this.file.slice(start, end);
            fileReader.readAsArrayBuffer(slice);
        });
    }
}
