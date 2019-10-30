<template>
    <b-container style="height: 100%">
        <b-row align-v="center" style="height: 100%">
            <b-col style="min-height: 300px">
                <h1 class="display-2 font-weight-bold">Download</h1>
                <h4>{{ name }}</h4>
                <size-indicator v-bind:size="size"></size-indicator>
                <b-button
                    variant="warning"
                    :disabled="downloading"
                    @click="download"
                    >{{ buttonName }}</b-button
                >
                <b-button
                    variant="dark"
                    title="Upload file"
                    @click="$router.push('/')"
                    >+</b-button
                >
            </b-col>
            <b-col>
                <img id="image" src="../../assets/image.svg" />
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import DownloadMetadata from "../../ts/downloadMetadata";
import DownloadFile from "../../ts/downloadFile";
import Metadata from "../../ts/metadata";
import SizeIndicator from "../SizeIndicator.vue";
import Vue from "vue";

@Component({
    components: { SizeIndicator }
})
export default class Download extends Vue {
    public size: number = 0;
    public name: string = "";
    public metadata: Metadata | undefined;
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

    get buttonName() {
        return this.downloading ? "Downloading..." : "Download";
    }
}
</script>
