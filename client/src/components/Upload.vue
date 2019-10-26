<template>
    <b-container style="height: 100%">
        <b-row class="align-items-center" style="height: 640px">
            <div style="position: relative">
                <h1 class="display-4">Nahrajte súbor</h1>
                <input v-if="!file" type="file" @change="changedInput" />
                <div v-if="file">{{ file.name }}</div>
                <b-button v-if="file" @click="upload">Upload</b-button>
                <b-button @click="cancelUpload">Close</b-button>
            </div>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import UploadFile from "../lib/uploadFile";

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
            const id = await this._uploader.send(this.onProgress); // id of file on server
            return true;
        } catch (e) {
            return false;
        }
    }

    public cancelUpload(): void {
        if (this._uploader) {
            this._uploader.cancel();
        }
    }
}
</script>
