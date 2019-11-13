<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Stiahnuť súbor"></main-title>
                <file-info
                    :name="metadata.name"
                    :size="metadata.size"
                ></file-info>
                <download-button @download="download"></download-button>
                <redirect-button
                    title="+"
                    to="/"
                    v-if="!downloading"
                ></redirect-button>
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
import SizeIndicator from "../SizeIndicator.vue";
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
import FileInfo from "../FileInfo.vue";
import DownloadButton from "../DownloadButton.vue";
import RedirectButton from "../RedirectButton.vue";
import Metadata from "../../ts/metadata";

@Component({
    components: {
        RedirectButton,
        DownloadButton,
        FileInfo,
        MainTitle,
        SizeIndicator
    }
})
export default class Download extends Vue {
    public downloading: boolean = false;
    public metadata: Metadata;
    private id: string = "";
    private key: string = "";
    private iv: Uint8Array | null = null;

    public constructor() {
        super();
        this.metadata = new Metadata({ name: "", size: 0 });
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
            ({
                iv: this.iv,
                metadata: this.metadata
            } = await downloadMetadata.download());
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
}
</script>
