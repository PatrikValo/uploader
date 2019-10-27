<template>
    <div>
        <h4 v-if="file">{{ file.name }}</h4>
        <progress-bar
            v-if="uploading"
            :uploaded="uploaded"
            :total="file.size"
        ></progress-bar>
        <b-button variant="warning" v-if="!uploading" @click="upload"
            >Upload</b-button
        >
        <b-button variant="warning" v-if="uploading" @click="cancelUpload"
            >Close</b-button
        >
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import UploadFile from "../lib/uploadFile";
import ProgressBar from "./ProgressBar.vue";

@Component({
    components: { ProgressBar },
    props: {
        file: File
    }
})
export default class UploadArea extends Vue {
    private _uploader: UploadFile | null;
    public uploading: boolean;
    public uploaded: number = 0;

    private onProgress(uploaded: number): void {
        this.uploaded += uploaded;
    }

    public constructor() {
        super();
        this._uploader = null;
        this.uploading = false;
    }

    public async upload(): Promise<void> {
        this._uploader = new UploadFile(
            this.$props.file,
            "ws://localhost:9998/api/upload"
        );

        this.uploading = true;

        try {
            const id = await this._uploader.send(this.onProgress); // id of file on server
            this.$emit("finish", { id: id });
        } catch (e) {
            // TODO if I push button cancel error is throw, but it is correct operation
            this.$emit("error", e);
        }
    }

    public cancelUpload(): void {
        if (this._uploader) {
            this._uploader.cancel();
        }
    }
}
</script>
