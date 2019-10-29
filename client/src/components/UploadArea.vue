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
import Vue from "vue";
import Component from "vue-class-component";
import UploadFile from "../ts/uploadFile";
import ProgressBar from "./ProgressBar.vue";
import Config from "../ts/config";

@Component({
    components: { ProgressBar },
    props: {
        file: File
    }
})
export default class UploadArea extends Vue {
    private _uploader: UploadFile | null = null;
    public uploadingProcess: boolean = false;
    public uploaded: number = 0;

    public constructor() {
        super();
    }

    public mounted() {
        const file = this.$props.file;
        // control of size limit
        if (file.size > Config.constrains.file.sizeLimit) {
            this.$emit("limit");
        }
    }

    private onProgress(uploaded: number): void {
        this.uploaded += uploaded;
    }

    public async upload() {
        this._uploader = new UploadFile(
            this.$props.file,
            Config.websocketUrl("/api/upload")
        );

        this.uploadingProcess = true;

        try {
            const id = await this._uploader.send(this.onProgress);
            if (!id) {
                return this.$emit("cancel");
            }
            return this.$emit("finish", { id: id });
        } catch (e) {
            return this.$emit("error", e);
        }
    }

    public cancelUpload(): void {
        if (this._uploader) {
            this._uploader.cancel();
        }
    }
}
</script>
