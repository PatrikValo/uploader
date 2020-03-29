<template>
    <b-container class="h-100">
        <loading-page v-if="!mount"></loading-page>
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Stiahnuť súbor"></main-title>
                <div v-if="showPasswordInput">
                    <b-alert v-if="alert" show variant="warning">{{
                        alert
                    }}</b-alert>
                    <password-confirm
                        @confirm="verify"
                        @focus="alert = ''"
                    ></password-confirm>
                </div>
                <download-area
                    v-if="showDownloadArea"
                    :id="id"
                    :sharing="sharing"
                    :metadata="metadata"
                    :decryption="decryption"
                ></download-area>
            </b-col>
            <b-col lg="6" md="4" class="d-none d-sm-none d-md-block">
                <box-image></box-image>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import DownloadMetadata from "../../ts/downloadMetadata";
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
import FileInfo from "../FileInfo.vue";
import DownloadButton from "../DownloadButton.vue";
import PasswordConfirm from "../PasswordConfirm.vue";
import LoadingPage from "../LoadingPage.vue";
import { DownloadCompatibility } from "../../ts/compatibility";
import ProgressBar from "../ProgressBar.vue";
import DownloadArea from "../DownloadArea.vue";
import BoxImage from "../BoxImage.vue";
import AuthDropbox from "../../ts/authDropbox";
import Utils from "../../ts/utils";
import Metadata from "../../ts/metadata";

@Component({
    components: {
        BoxImage,
        DownloadArea,
        ProgressBar,
        LoadingPage,
        PasswordConfirm,
        DownloadButton,
        FileInfo,
        MainTitle
    },
    props: {
        auth: AuthDropbox
    }
})
export default class Download extends Vue {
    private showInput: boolean = false;
    private mount: boolean = false;
    private alert: string = "";
    private id: string = "";
    private sharing: string = "";
    private metadata: Metadata | null = null;
    private decryption: { key: Uint8Array; iv: Uint8Array } | null = null;
    private downloadMetadata: DownloadMetadata | null = null;

    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    async mounted() {
        if (!DownloadCompatibility.isCompatible()) {
            return await this.$router.push("/compatibility");
        }

        this.id = this.$route.params.id;
        this.sharing = this.$route.params.sharing;
        this.downloadMetadata = new DownloadMetadata(this.id, this.sharing);

        try {
            // file with password
            const pw = await this.downloadMetadata.passwordIsRequired();
            if (!pw) {
                // file without password
                if (this.$route.hash.length <= 1) {
                    return await this.$router.push("/error");
                }

                const key = Utils.base64toUint8Array(
                    this.$route.hash.substr(1)
                );

                const result = await this.downloadMetadata.download(key);

                if (!result) {
                    return await this.$router.push("/error");
                }
                this.metadata = result.metadata;
                this.decryption = result.decryptionForFile;
                this.mount = true;
                return;
            }

            // file with password
            this.showInput = true;
            this.mount = true;
        } catch (e) {
            return await this.$router.push("/error");
        }
    }

    public async verify(password: string): Promise<void> {
        if (!this.downloadMetadata) {
            return;
        }
        this.mount = false;
        try {
            const result = await this.downloadMetadata.download(password);

            if (!result) {
                this.alert = "Nesprávne heslo";
                this.mount = true;
                return;
            }

            this.metadata = result.metadata;
            this.decryption = result.decryptionForFile;
            this.showInput = false;
        } catch (e) {
            this.alert = "Pri overovaní nastala chyba";
        }
        this.mount = true;
    }

    public get showPasswordInput() {
        return this.mount && this.showInput;
    }

    public get showDownloadArea() {
        return (
            this.mount && !this.showInput && this.metadata && this.decryption
        );
    }
}
</script>
