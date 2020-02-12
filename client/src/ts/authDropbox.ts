import { Dropbox } from "dropbox";
import { EventEmitter } from "events";
import Utils from "./utils";

export default class AuthDropbox extends EventEmitter {
    private readonly clientId: string;
    private accessToken: string;
    private accountId: string;

    public constructor() {
        super();
        const token = localStorage.getItem("accessToken");
        const id = localStorage.getItem("accountId");

        this.clientId = "bkuer2khx5tv3zn";
        this.accessToken = token ? token : "";
        this.accountId = id ? id : "";
    }

    public getAuthUrl(): string {
        const dbx = new Dropbox({ clientId: this.clientId, fetch });
        const auth = Utils.buildUrl("auth/", "", "");
        return dbx.getAuthenticationUrl(auth);
    }

    public logIn(hash: string): void {
        const items = hash.split("&");
        const accessToken: string = items[0].split("=")[1];
        const accountId: string = decodeURIComponent(items[3].split("=")[1]);
        this.setAccessToken(accessToken);
        this.setAccountId(accountId);
        this.emit("changeStatus", true);
    }

    public logOut(): void {
        this.setAccountId("");
        this.setAccessToken("");
        this.emit("changeStatus", false);
    }

    public isLoggedIn(): boolean {
        return !!this.accessToken;
    }

    public getDropboxObject(): Dropbox {
        return new Dropbox({
            accessToken: this.accessToken,
            clientId: this.clientId,
            fetch
        });
    }

    public getAccessToken(): string {
        return this.accessToken;
    }

    public getAccountId(): string {
        return this.accountId;
    }

    private setAccessToken(accessToken: string): void {
        this.accessToken = accessToken;
        localStorage.setItem("accessToken", accessToken);
    }

    private setAccountId(accountId: string): void {
        this.accountId = accountId;
        localStorage.setItem("accountId", accountId);
    }
}
