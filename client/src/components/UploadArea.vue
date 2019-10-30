<template>
    <div>
        <h4 v-if="file">{{ file.name }}</h4>
        <progress-bar
            v-if="uploadingProcess"
            :uploaded="uploaded"
            :total="file.size"
        ></progress-bar>
        <b-button variant="warning" v-if="!uploadingProcess" @click="upload"
            >Upload</b-button
        >
        <b-button
            variant="warning"
            v-if="uploadingProcess"
            @click="cancelUpload"
            >Close</b-button
        >
    </div>
</template>

<script lang="ts">
import Config from "../ts/config";
import Component from "vue-class-component";
import ProgressBar from "./ProgressBar.vue";
import UploadFile from "../ts/uploadFile";
import Utils from "../ts/utils";
import Vue from "vue";

@Component({
    components: { ProgressBar },
    props: {
        file: File
    }
})
export default class UploadArea extends Vue {
    private uploader: UploadFile | null = null;
    public uploadingProcess: boolean = false;
    public uploaded: number = 0;

    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        const file = this.$props.file;
        // control of size limit
        if (file.size > Config.client.fileSizeLimit) {
            this.$emit("limit");
        }
    }

    private onProgress(uploaded: number): void {
        this.uploaded += uploaded;
    }

    public async upload() {
        this.uploader = new UploadFile(
            this.$props.file,
            Utils.server.websocketUrl("/api/upload")
        );

        this.uploadingProcess = true;

        try {
            const id = await this.uploader.send(this.onProgress);
            if (!id) {
                return this.$emit("cancel");
            }
            const url = Utils.buildUrl(id, "");
            return this.$emit("finish", url);
        } catch (e) {
            return this.$emit("error", new Error("Error during sending file"));
        }
    }

    public cancelUpload(): void {
        if (this.uploader) {
            this.uploader.cancel();
        }
    }
}
</script>
