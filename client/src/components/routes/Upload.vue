<template>
    <b-container style="height: 100%">
        <b-row class="align-items-center" style="height: 640px">
            <div style="position: relative">
                <h1 class="display-4">Upload file</h1>
                <input v-if="!file" type="file" @change="changedInput" />
                <upload-area v-if="file" :file="file"></upload-area>
            </div>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import UploadFile from "../../lib/uploadFile";
import UploadArea from "../UploadArea.vue";
@Component({
    components: { UploadArea }
})
export default class Upload extends Vue {
    public file: File | null;

    public constructor() {
        super();
        this.file = null;
    }

    public changedInput(e: any): void {
        if (e.target.files.length > 0) {
            this.file = e.target.files[0];
        }
    }
}
</script>
