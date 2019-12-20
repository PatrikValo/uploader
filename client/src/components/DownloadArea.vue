<template>
    <div>
        <b-alert v-if="alert" show variant="warning">{{ alert }}</b-alert>
        <file-info :name="metadata.name" :size="metadata.size"></file-info>
        <progress-bar
            v-if="downloading"
            :uploaded="uploaded"
            :total="metadata.size"
        ></progress-bar>
        <download-button
            v-if="showDownloadButton"
            :downloading="downloading"
            @download="download"
        ></download-button>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import Metadata from "../ts/metadata";
import { Cipher } from "../ts/cipher";
import { DownloadCompatibility } from "../ts/compatibility";
import Config from "../ts/config";
import DownloadFile from "../ts/downloadFile";
import FileInfo from "./FileInfo.vue";
import ProgressBar from "./ProgressBar.vue";
import DownloadButton from "./DownloadButton.vue";

@Component({
    components: { DownloadButton, ProgressBar, FileInfo },
    props: {
        id: String,
        metadata: Metadata,
        cipher: Object as () => Cipher
    }
})
export default class DownloadArea extends Vue {
    public downloading: boolean = false;
    public uploaded: number = 0;
    public alert: string = "";
    private readonly blob: boolean;

    public constructor() {
        super();
        this.blob = DownloadCompatibility.blob();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {}

    public async download(): Promise<void> {
        if (!this.$props.cipher) {
            return;
        }

        const download = new DownloadFile(
            this.$props.id,
            this.$props.metadata,
            this.$props.cipher
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

    public get showDownloadButton(): boolean {
        const blobLimit = Config.client.blobFileSizeLimit;

        if (this.blob && blobLimit < this.$props.metadata.size) {
            this.alert = "Na Vašom prehliadači je možnosť stiahnuť max. 250MB";
            return false;
        }

        return true;
    }
}
</script>
