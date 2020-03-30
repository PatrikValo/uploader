import { Encryption } from "./cipher";
import Config from "./config";
import Metadata from "./metadata";

export default class UploadSource {
    private encryptor: Encryption;
    private readonly fileStream: FileSource;
    private readonly metadata: Metadata;
    private readonly password: boolean;
    private sendPlainData = false;
    private sendMetadata = false;
    private sendFile = false;

    /**
     * It creates new instance of UploadSource class.
     * @param file
     * @param password
     */
    public constructor(file: File, password?: string) {
        this.encryptor = new Encryption(password);
        this.fileStream = new FileSource(file);
        this.metadata = new Metadata(file);
        this.password = !!password;
    }

    /**
     * It exports the key, which was used for encryption
     *
     * @return Promise with exported key
     */
    public exportKey(): Promise<string> {
        return this.encryptor.exportKey();
    }

    /**
     * Each time when this method is called, it returns part of file or
     * metadata (iv, flag, ..., file's metadata), which should be send to server next.
     *
     * @param progress - it is executed, if chunk of file was read
     * @return null - there is nothing to read from file
     *         data - otherwise
     */
    public async getContent(
        progress: (u: number) => any
    ): Promise<Uint8Array | null> {
        if (!this.sendPlainData) {
            this.sendPlainData = true;
            return this.createPlainData();
        }

        if (!this.sendMetadata) {
            this.sendMetadata = true;
            const metadata = await this.createMetadata();
            const newIV = metadata.slice(-Config.cipher.ivLength);
            this.encryptor.reset(newIV);
            return metadata;
        }

        if (!this.sendFile) {
            return this.createChunk(progress);
        }

        return null;
    }

    private async createPlainData(): Promise<Uint8Array> {
        const iv = await this.encryptor.getInitializationVector();
        const flagUint = new Uint8Array([this.password ? 1 : 0]);
        const salt = await this.encryptor.getSalt();

        const result = new Uint8Array(
            iv.length + flagUint.length + salt.length
        );
        result.set(iv);
        result.set(flagUint, iv.length);
        result.set(salt, iv.length + flagUint.length);
        return result;
    }

    /**
     * It returns encrypted metadata with its length.
     *
     * @return length joins with metadata
     */
    private async createMetadata(): Promise<Uint8Array> {
        // encryption
        const metadata = await this.encryptor.encrypt(
            this.metadata.toUint8Array()
        );
        const final = await this.encryptor.final();

        // length
        const length: Uint8Array = Metadata.lengthToUint8Array(
            metadata.length + final.length
        );

        // concat
        const m = new Uint8Array(
            length.length + metadata.length + final.length
        );
        m.set(length);
        m.set(metadata, length.length);
        m.set(final, length.length + metadata.length);
        return m;
    }

    /**
     * It returns encrypted chunk of file and progress is executed with length
     * of chunk before encryption. Method returns null, if there is nothing
     * to read from file.
     *
     * @param progress
     * @return null - whole file was returned in previous callings of this method
     *         chunk - otherwise
     */
    private async createChunk(
        progress: (u: number) => any
    ): Promise<Uint8Array> {
        const chunk = await this.fileStream.read();

        if (chunk) {
            const uploaded = chunk.length;
            progress(uploaded); // users function
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
    private chunkSize: number = Config.client.chunkSize - 16;

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
