import { Cipher, ClassicCipher, PasswordCipher } from "../cipher";
import FileStream from "../fileStream";
import IUploadFile from "../interfaces/IUploadFile";
import Metadata from "../metadata";

export default abstract class AbstractUploadFile implements IUploadFile {
    private readonly cipher: Cipher;
    private readonly fileStream: FileStream;
    private readonly metadata: Metadata;
    private readonly password: boolean;
    private stop: boolean = false;
    private sendIv = false;
    private sendFlag = false;
    private sendSalt = false;
    private sendMetadata = false;

    protected constructor(file: File, password?: string) {
        this.cipher = password
            ? new PasswordCipher(password)
            : new ClassicCipher();
        this.fileStream = new FileStream(file);
        this.metadata = new Metadata(file);
        this.password = !!password;
    }

    public abstract upload(
        progress: (u: number) => any
    ): Promise<{ id: string; key: string }>;

    public cancel(): void {
        this.stop = true;
    }

    public isCanceled(): boolean {
        return this.stop;
    }

    /**
     * It exports the key, which was used for encryption
     *
     * @return empty string - if key was derived from password
     *          exported key - otherwise
     */
    protected async exportKey(): Promise<string> {
        if (this.password) {
            return "";
        }

        return await this.cipher.exportedKey();
    }

    /**
     * Each time when this method is called, it returns part of file or
     * metadata (iv, flag, ..., file's metadata), which should be send to server next.
     * Progress is executed when metadata was sent and file is currently read.
     * Progress is executed with length of chunk before encryption.
     * @param progress
     * @return null - there is nothing to read from file
     *         data - otherwise
     */
    protected async content(
        progress: (u: number) => any
    ): Promise<Uint8Array | null> {
        if (!this.sendIv) {
            this.sendIv = true;
            return this.createIv();
        }

        if (!this.sendFlag) {
            this.sendFlag = true;
            return this.createFlag();
        }

        if (!this.sendSalt) {
            this.sendSalt = true;
            return this.createSalt();
        }

        if (!this.sendMetadata) {
            this.sendMetadata = true;
            return this.createMetadata();
        }

        return this.createChunk(progress);
    }

    /**
     * It returns initialisation vector, which is used for encryption.
     *
     * @return iv
     */
    private createIv(): Promise<Uint8Array> {
        return this.cipher.getInitializationVector();
    }

    /**
     * It returns flag. Length of flag is 1. If key was derived from
     * password, flag contains 1. Flag contains 0, otherwise.
     *
     * @return flag
     */
    private createFlag(): Promise<Uint8Array> {
        return new Promise(resolve => {
            const flags = new Uint8Array(1);
            flags[0] = this.password ? 1 : 0;
            return resolve(flags);
        });
    }

    /**
     * It returns salt, which was used for deriving the key from password. If
     * password wasn't available, salt contains only zeros.
     *
     * @return salt
     */
    private async createSalt(): Promise<Uint8Array> {
        return await this.cipher.getSalt();
    }

    /**
     * It returns encrypted metadata with its length.
     *
     * @return length joins with metadata
     */
    private async createMetadata(): Promise<Uint8Array> {
        const metadata = await this.cipher.encryptMetadata(this.metadata);
        const length: Uint8Array = Metadata.lengthToUint8Array(metadata.length);

        const m = new Uint8Array(length.length + metadata.length);
        m.set(length);
        m.set(metadata, length.length);
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
    ): Promise<Uint8Array | null> {
        const chunk = await this.fileStream.read();
        const uploaded = chunk.value.length;
        progress(uploaded); // users function

        if (!chunk.done) {
            return await this.cipher.encryptChunk(chunk.value);
        }

        return null;
    }
}
