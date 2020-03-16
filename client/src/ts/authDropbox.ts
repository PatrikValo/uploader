import { Dropbox } from "dropbox";
import { EventEmitter } from "events";
import fetch from "isomorphic-fetch";
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

    /**
     * It creates url for Authentication to dropbox
     *
     * @return url
     */
    public getAuthUrl(): string {
        const dbx = new Dropbox({ clientId: this.clientId, fetch });
        const auth = Utils.buildUrl("auth/", "", "");
        return dbx.getAuthenticationUrl(auth);
    }

    /**
     * It parses the information generated by dropbox from url beside hashtag
     * symbol. If this information is correct, accoundId and accessToken is
     * stored to localStorage and changeStatus event is emitted with True param.
     *
     * @param data
     * @exception Error - if data isn't correct
     */
    public login(data: string): void {
        const items = data.split("&");
        const accessToken: string = items[0].split("=")[1];
        const accountId: string = decodeURIComponent(items[3].split("=")[1]);
        this.setAccessToken(accessToken);
        this.setAccountId(accountId);
        this.emit("changeStatus", true);
    }

    /**
     * It clears information about user from local storage and changeStatus event
     * is emitted with False param.
     */
    public async logout(): Promise<void> {
        await this.getDropboxObject().authTokenRevoke();
        this.setAccountId("");
        this.setAccessToken("");
        this.emit("changeStatus", false);
    }

    /**
     * It checks if the accessToken is defined => user is signed in dropbox
     *
     * @return True - accessToken is defined
     *         False - otherwise
     */
    public isLoggedIn(): boolean {
        return !!this.accessToken;
    }

    /**
     * It creates and return Dropbox object, where is defined accessToken, clientId
     *
     * @return dropbox object
     */
    public getDropboxObject(): Dropbox {
        return new Dropbox({
            accessToken: this.accessToken,
            clientId: this.clientId,
            fetch
        });
    }

    /**
     * Getter for accountId
     *
     * @return accountId or empty string
     */
    public getAccountId(): string {
        return this.accountId;
    }

    /**
     * Setter for accessToken and it also stores token to local storage
     *
     * @param accessToken
     */
    private setAccessToken(accessToken: string): void {
        this.accessToken = accessToken;
        localStorage.setItem("accessToken", accessToken);
    }

    /**
     * Setter for accoundId and it also stores id to local storage
     *
     * @param accountId
     */
    private setAccountId(accountId: string): void {
        this.accountId = accountId;
        localStorage.setItem("accountId", accountId);
    }
}
