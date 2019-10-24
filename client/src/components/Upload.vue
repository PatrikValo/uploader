<template>
    <b-container>
        <h1 class="display-4">Upload</h1>
        <input v-if="!file" type="file" @change="changedInput" />
        <div v-if="file">{{ file.name }}</div>
        <button v-if="file" @click="upload">Upload</button>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import UploadFile from "../lib/uploadFile";

// TODO create new component for uploading
@Component
export default class Upload extends Vue {
    public file: File | null;

    private _uploader: UploadFile | null;

    private onProgress(uploaded: number): void {
        // TODO
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
            "ws://localhost:9998/api/upload"
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
