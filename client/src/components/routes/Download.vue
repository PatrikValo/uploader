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
                    :metadata="metadata"
                    :cipher="cipher"
                    :start-from="startFrom"
                    :auth="auth"
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
import {
    DownloadMetadataServer,
    DownloadMetadataDropbox
} from "../../ts/downloadMetadata";
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
import FileInfo from "../FileInfo.vue";
import DownloadButton from "../DownloadButton.vue";
import Metadata from "../../ts/metadata";
import PasswordConfirm from "../PasswordConfirm.vue";
import LoadingPage from "../LoadingPage.vue";
import { DownloadCompatibility } from "../../ts/compatibility";
import ProgressBar from "../ProgressBar.vue";
import { Cipher, PasswordCipher, ClassicCipher } from "../../ts/cipher";
import DownloadArea from "../DownloadArea.vue";
import BoxImage from "../BoxImage.vue";
import AuthDropbox from "../../ts/authDropbox";

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
    public showInput: boolean = false;
    public mount: boolean = false;
    public alert: string = "";
    public id: string = "";
    public metadata: Metadata | null = null;
    public cipher: Cipher | null = null;
    private iv: Uint8Array | null = null;
    private rawMetadata: Uint8Array | null = null;
    private salt: Uint8Array | null = null;
    private startFrom: number | null = null;

    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    async mounted() {
        if (!DownloadCompatibility.isCompatible()) {
            return await this.$router.push("/compatibility");
        }

        this.id = this.$route.params.id;
        const a: AuthDropbox = this.$props.auth;

        const downloadMetadata = a.isLoggedIn()
            ? new DownloadMetadataDropbox(this.id, a)
            : new DownloadMetadataServer(this.id);

        try {
            const result = await downloadMetadata.download();
            this.iv = result.iv;
            this.rawMetadata = result.metadata;
            this.salt = result.password.salt;
            this.startFrom = result.startFrom;

            // file with password
            if (result.password.flag) {
                this.showInput = true;
            } else {
                // file without password

                if (this.$route.hash.length <= 1) {
                    return await this.$router.push("/error");
                }

                const key = this.$route.hash.substr(1);

                this.cipher = new ClassicCipher(key, this.iv);

                this.metadata = await this.cipher.decryptMetadata(
                    this.rawMetadata
                );
            }
            this.mount = true;
        } catch (e) {
            return await this.$router.push("/error");
        }
    }

    public async verify(password: string): Promise<void> {
        if (!this.iv || !this.rawMetadata || !this.salt) {
            return;
        }

        this.cipher = new PasswordCipher(password, this.salt, this.iv);

        try {
            this.metadata = await this.cipher.decryptMetadata(this.rawMetadata);
            this.showInput = false;
        } catch (e) {
            this.alert = "Nesprávne heslo";
        }
    }

    public get showPasswordInput() {
        return this.mount && this.showInput;
    }

    public get showDownloadArea() {
        return this.mount && !this.showInput && this.metadata;
    }
}
</script>
