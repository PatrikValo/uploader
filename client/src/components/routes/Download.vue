<template>
    <b-container class="h-100">
        <loading-page v-if="!mount"></loading-page>
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Stiahnuť súbor"></main-title>
                <b-alert v-if="alert" show variant="warning">{{
                    alert
                }}</b-alert>
                <file-info
                    :name="metadata.name"
                    :size="metadata.size"
                ></file-info>
                <progress-bar
                    v-if="showProgressBar"
                    :uploaded="uploaded"
                    :total="metadata.size"
                ></progress-bar>
                <password-confirm
                    v-if="showPasswordInput"
                    @confirm="verify"
                ></password-confirm>
                <download-button
                    v-if="showDownloadButton"
                    :downloading="downloading"
                    @download="download"
                ></download-button>
            </b-col>
            <b-col lg="6" md="4" class="d-none d-sm-none d-md-block">
                <img
                    id="image"
                    src="../../assets/image.svg"
                    alt="Paper planes"
                />
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import DownloadMetadata from "../../ts/downloadMetadata";
import DownloadFile from "../../ts/downloadFile";
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
import FileInfo from "../FileInfo.vue";
import DownloadButton from "../DownloadButton.vue";
import Metadata from "../../ts/metadata";
import Password from "../../ts/password";
import PasswordConfirm from "../PasswordConfirm.vue";
import LoadingPage from "../LoadingPage.vue";
import { DownloadCompatibility } from "../../ts/compatibility";
import ProgressBar from "../ProgressBar.vue";
import Config from "../../ts/config";

@Component({
    components: {
        ProgressBar,
        LoadingPage,
        PasswordConfirm,
        DownloadButton,
        FileInfo,
        MainTitle
    }
})
export default class Download extends Vue {
    public downloading: boolean = false;
    public metadata: Metadata;
    public showInput: boolean;
    public mount: boolean = false;
    public blob: boolean = false;
    public uploaded: number = 0;
    public alert: string = "";
    private id: string = "";
    private key: string = "";
    private iv: Uint8Array | null = null;

    public constructor() {
        super();
        this.metadata = new Metadata({ name: "", size: 0 });
        this.showInput = false;
    }

    // noinspection JSUnusedGlobalSymbols
    async mounted() {
        if (!DownloadCompatibility.isCompatible()) {
            return await this.$router.push("/compatibility");
        }

        this.blob = DownloadCompatibility.blob();

        this.id = this.$route.params.id;

        if (this.$route.hash.length <= 1) {
            // there is no key
            return await this.$router.push("/error");
        }

        this.key = this.$route.hash.substr(1);

        const downloadMetadata = new DownloadMetadata(this.id, this.key);

        try {
            const result = await downloadMetadata.download();
            this.iv = result.iv;
            this.metadata = result.metadata;

            this.createView();
        } catch (e) {
            return await this.$router.push("/error");
        }
    }

    public async download(): Promise<void> {
        if (!this.iv || !this.key) {
            return;
        }

        const download = new DownloadFile(
            this.$route.params.id,
            this.metadata,
            this.key,
            this.iv
        );

        const progress = (u: number) => {
            this.uploaded += u;
        };

        try {
            this.downloading = true;
            await download.download(this.blob, progress);
        } catch (e) {
            this.alert = "Pri sťahovaní nastala chyba";
            console.log("Nastala chyba!", e);
        }

        this.downloading = false;
        this.uploaded = 0;
    }

    public async verify(password: string): Promise<void> {
        if (this.key && this.metadata && this.metadata.password) {
            const pw = new Password(password, this.metadata.password.salt);
            this.showInput = !(await pw.equalToBase64(this.key));
        }
    }

    public createView() {
        const blobLimit = Config.client.blobFileSizeLimit;
        const msg = "Na Vašom prehliadači je možnosť stiahnuť max. 250MB";

        // show password input or not
        this.showInput = this.metadata.hasPassword();
        // blob limit
        this.alert = this.blob && blobLimit < this.metadata.size ? msg : "";
        // view is created
        this.mount = true;
    }

    public get showProgressBar(): boolean {
        return this.downloading && this.blob;
    }

    public get showPasswordInput(): boolean {
        return this.showInput && this.mount && !this.alert;
    }

    public get showDownloadButton(): boolean {
        return !this.showInput && this.mount && !this.alert;
    }
}
</script>
