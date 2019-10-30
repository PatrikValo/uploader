<template>
    <b-container style="height: 100%">
        <b-row align-v="center" style="height: 100%">
            <b-col style="height: 300px">
                <h1 class="display-2 font-weight-bold">Upload file</h1>
                <input
                    id="file-upload"
                    v-if="!file"
                    type="file"
                    @change="changedInput"
                />
                <label
                    v-if="!file"
                    for="file-upload"
                    class="btn btn-warning"
                    title="Choose file"
                    >Choose file</label
                >
                <upload-area
                    v-if="file"
                    :file="file"
                    @finish="finish"
                    @error="error"
                    @cancel="cancel"
                    @limit="limit"
                ></upload-area>
            </b-col>
            <b-col>
                <img id="image" src="../../assets/image.svg" />
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import UploadArea from "../UploadArea.vue";
import Vue from "vue";

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

    public error(e: Error) {
        console.log("Nastala chyba!", e.message);
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
<style scoped>
#file-upload {
    position: absolute;
    height: 0;
    width: 0;
    opacity: 0;
}

label {
    cursor: pointer;
}
</style>
