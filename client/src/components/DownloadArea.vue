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
            :downloading="downloading"
            @download="download"
            @cancel="cancel"
        ></download-button>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import Metadata from "../ts/metadata";
import { DownloadCompatibility } from "../ts/compatibility";
import Config from "../ts/config";
import DownloadFile from "../ts/downloadFile";
import FileInfo from "./FileInfo.vue";
import ProgressBar from "./ProgressBar.vue";
import DownloadButton from "./DownloadButton.vue";
import { StorageType } from "../ts/interfaces/storageType";

@Component({
    components: { DownloadButton, ProgressBar, FileInfo },
    props: {
        id: String,
        receiver: String as () => StorageType,
        metadata: Metadata,
        decryption: Object as () => { key: Uint8Array; iv: Uint8Array }
    }
})
export default class DownloadArea extends Vue {
    private downloading: boolean = false;
    private uploaded: number = 0;
    private alert: string = "";
    private downloader: DownloadFile | null = null;
    private readonly blob: boolean;

    public constructor() {
        super();
        this.blob = DownloadCompatibility.blob();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        const { blobFileSizeLimit } = Config.client;
        const { size } = this.$props.metadata;

        if (this.blob && blobFileSizeLimit < size) {
            this.alert =
                "Sťahovanie súboru na Vašom prehliadači nemusí byť úspešné";
        }
    }

    public async download(): Promise<void> {
        this.downloader = new DownloadFile(
            this.$props.id,
            this.$props.receiver,
            this.$props.metadata,
            this.$props.decryption
        );

        const progress = (u: number) => {
            this.uploaded += u;
        };

        try {
            this.downloading = true;
            await this.downloader.download(this.blob, progress);
        } catch (e) {
            this.alert = "Pri sťahovaní nastala chyba";
            console.error("Nastala chyba!", e);
        }

        this.downloader = null;
        this.downloading = false;
        this.uploaded = 0;
    }

    public cancel() {
        if (this.downloader) {
            this.downloader.cancel();
        }
    }
}
</script>
