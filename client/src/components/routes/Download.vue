<template>
    <b-container style="height: 100%">
        <b-row class="align-items-center" style="height: 640px">
            <div style="position: relative">
                <h1 class="display-4">Download</h1>
                <h4>{{ name }}</h4>
                <size-indicator v-bind:size="size"></size-indicator>
                <b-button variant="warning" @click="download"
                    >Download</b-button
                >
            </div>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import MetadataFile from "../../lib/metadataFile";
import Metadata from "../../lib/metadata";
import DownloadFile from "../../lib/downloadFile";
import SizeIndicator from "../SizeIndicator.vue";

@Component({
    components: { SizeIndicator }
})
export default class Download extends Vue {
    public size: number = 0;
    public name: string = "";
    public metadata: Metadata | undefined;

    public constructor() {
        super();
    }

    async mounted() {
        const id: string = this.$route.params.id;

        const metadataFile = new MetadataFile(id);
        try {
            const result = await metadataFile.getInfo();
            const iv = result.iv;
            const metadata = new Metadata(result.metadata);
            this.name = metadata.name;
            this.size = metadata.size;
        } catch (e) {
            await this.$router.push("/error");
        }
    }

    public download() {
        const download = new DownloadFile(
            this.$route.params.id,
            this.name,
            this.size
        );

        download.download();
    }
}
</script>
