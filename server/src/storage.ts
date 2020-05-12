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

    public removeAllFilesOlderThan(days: number) {
        fs.readdir(this.path, (err, files) => {
            files.forEach(file => {
                const fileLocation = pathObj.join(this.path, file);
                fs.stat(fileLocation, async (error, stat) => {
                    if (stat.isFile() && file !== ".gitkeep") {
                        const date = stat.mtime;
                        date.setDate(date.getDate() + days);
                        if (date < new Date()) {
                            await this.remove(file);
                        }
                    }
                });
            });
        });
    }

    public writableStream(id: string): fs.WriteStream {
        const path = pathObj.join(this.path, id);
        return fs.createWriteStream(path, { flags: "a" });
    }
}
