<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Nahrať súbor"></main-title>
                <input
                    id="file-upload"
                    v-if="!file"
                    type="file"
                    @change="changedInput"
                />
                <label
                    id="file-upload-label"
                    v-if="!file"
                    for="file-upload"
                    class="btn btn-warning"
                    title="Vybrať súbor"
                    >Vybrať súbor</label
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
            <b-col lg="6" md="4" class="d-none d-sm-none d-md-block">
                <img
                    id="image"
                    src="../../assets/image.svg"
                    alt="Paper planes"
                />
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import MainTitle from "../MainTitle.vue";
import UploadArea from "../UploadArea.vue";
import Vue from "vue";
import Utils from "../../ts/utils";

@Component({
    components: { UploadArea, MainTitle }
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

    public finish(e: { id: string; key: string }): void {
        this.file = null;
        const path = Utils.buildPath("copy", e.id, e.key);
        this.$router.push(path);
    }

    public error(e: Error): void {
        console.log("Nastala chyba!", e.message);
        this.file = null;
    }

    public cancel(): void {
        console.log("Nahravanie bolo zastavené!");
        this.file = null;
    }

    public limit(): void {
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

#file-upload-label {
    margin-top: 5px;
}

label {
    cursor: pointer;
}
</style>
