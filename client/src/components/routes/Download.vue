<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Stiahnuť súbor"></main-title>
                <file-info :name="name" :size="size"></file-info>
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
import Metadata from "../../ts/metadata";
import SizeIndicator from "../file/SizeIndicator.vue";
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
import FileInfo from "../file/FileInfo.vue";
import DownloadButton from "../buttons/DownloadButton.vue";
import RedirectButton from "../buttons/RedirectButton.vue";

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
    public size: number = 0;
    public name: string = "";
    public metadata: Metadata | null = null;
    public downloading: boolean = false;

    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    async mounted() {
        const id: string = this.$route.params.id;

        const downloadMetadata = new DownloadMetadata(id);
        try {
            const result = await downloadMetadata.getInfo();
            const iv = result.iv;
            console.log({ iv });
            const metadata = new Metadata(result.metadata);
            this.name = metadata.name;
            this.size = metadata.size;
        } catch (e) {
            await this.$router.push("/error");
        }
    }

    public async download() {
        const download = new DownloadFile(
            this.$route.params.id,
            this.name,
            this.size
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
