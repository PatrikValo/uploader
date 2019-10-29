<template>
    <b-container style="height: 100%">
        <b-row class="align-items-center" style="height: 640px">
            <div style="position: relative">
                <h1 class="display-4">Upload file</h1>
                <input v-if="!file" type="file" @change="changedInput" />
                <upload-area
                    v-if="file"
                    :file="file"
                    @finish="finish"
                    @error="error"
                    @cancel="cancel"
                    @limit="limit"
                ></upload-area>
            </div>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
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

    public finish(e: { id: string }) {
        console.log(e);
        this.file = null;
    }

    public error(e: any) {
        console.log("Nastala chyba!", e);
        this.file = null;
    }

    public cancel() {
        console.log("Nahravanie bolo zastavené!");
        this.file = null;
    }

    public limit() {
        console.log("Súbor presahuje veľkostný limit!");
        this.file = null;
    }
}
</script>
