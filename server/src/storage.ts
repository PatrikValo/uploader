import fs from "fs";
import pathObj from "path";
import Config from "./config";

export class Storage {
    private readonly path: string;

    public constructor(path?: string) {
        this.path = path || Config.spacePath;
    }

    public exist(id: string): boolean {
        const path = pathObj.join(this.path, id);
        try {
            fs.accessSync(path, fs.constants.R_OK);
            return true;
        } catch (e) {
            return false;
        }
    }

    public remove(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const path = pathObj.join(this.path, id);

            fs.unlink(path, err => {
                if (err) {
                    return reject(err);
                }
                return resolve(true);
            });
        });
    }

    public writableStream(id: string): fs.WriteStream {
        const path = pathObj.join(this.path, id);
        return fs.createWriteStream(path, { flags: "a" });
    }
}
