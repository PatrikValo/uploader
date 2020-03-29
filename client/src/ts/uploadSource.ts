import { Encryption } from "./cipher";
import Config from "./config";
import FileStream from "./fileSource";
import Metadata from "./metadata";
import Utils from "./utils";

export default class UploadSource {
    private encryptor: Encryption;
    private readonly fileStream: FileStream;
    private readonly metadata: Metadata;
    private readonly password: boolean;
    private sendPlainData = false;
    private sendMetadata = false;
    private sendFile = false;

    public constructor(file: File, password?: string) {
        this.encryptor = new Encryption(password);
        this.fileStream = new FileStream(file);
        this.metadata = new Metadata(file);
        this.password = !!password;
    }

    /**
     * It exports the key, which was used for encryption
     *
     * @return empty string - if key was derived from password
     *          exported key - otherwise
     */
    public async exportKey(): Promise<string> {
        if (this.password) {
            return "";
        }

        const key = await this.encryptor.getKey();
        return Utils.Uint8ArrayToBase64(key);
    }

    /**
     * Each time when this method is called, it returns part of file or
     * metadata (iv, flag, ..., file's metadata), which should be send to server next.
     * Progress is executed when metadata was sent and file is currently read.
     * @param progress
     * @return null - there is nothing to read from file
     *         data - otherwise
     */
    public async getChunk(
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
            const key = await this.encryptor.getKey();
            this.encryptor = new Encryption(key, newIV);
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
