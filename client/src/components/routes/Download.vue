<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Stiahnuť súbor"></main-title>
                <file-info
                    :name="metadata.name"
                    :size="metadata.size"
                ></file-info>
                <password-confirm
                    v-if="showInput"
                    @confirm="verified"
                ></password-confirm>
                <download-button
                    v-if="!showInput"
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

@Component({
    components: {
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

            // show password input or not
            this.showInput = this.metadata.hasPassword();
        } catch (e) {
            await this.$router.push("/error");
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

        try {
            this.downloading = true;
            await download.download();
        } catch (e) {
            console.log("Nastala chyba!", e);
        }

        this.downloading = false;
    }

    public async verified(password: string): Promise<void> {
        if (this.key && this.metadata && this.metadata.password) {
            const pw = new Password(password, this.metadata.password.salt);
            this.showInput = !(await pw.equalToBase64(this.key));
        }
    }
}
</script>
