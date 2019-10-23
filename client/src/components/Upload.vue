<template>
    <div>
        <h1>Upload</h1>
        <input v-if="!file" type="file" @change="changedInput" />
        <div v-if="file">{{ file.name }}</div>
        <button v-if="file" @click="upload">Upload</button>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import UploadFile from "../lib/uploadFile";

@Component
export default class Upload extends Vue {
    private file: File | null;
    // TODO create new component for uploading
    private _uploader: UploadFile | null;

    private onProgress(uploaded: number): void {
        // TODO action called when value of uploaded bytes is increasing
    }

    public constructor() {
        super();
        this.file = null;
        this._uploader = null;
    }

    public changedInput(e: any): void {
        if (e.target.files.length > 0) {
            this.file = e.target.files[0];
        }
    }

    public async upload(): Promise<boolean> {
        if (!this.file) return false;

        this._uploader = new UploadFile(
            this.file,
            "ws://localhost:3000/api/upload"
        );

        try {
            // id of file on server
            const id = await this._uploader.send(this.onProgress);
            return true;
        } catch (e) {
            return false;
        }
    }

    public cancelUpload(): boolean {
        if (!this._uploader) return false;

        this._uploader.cancel();

        // TODO remove file because it is no more used, but _uploader can still send max one message

        return true;
    }
}
</script>
