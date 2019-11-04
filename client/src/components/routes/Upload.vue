<template>
    <b-container style="height: 100%">
        <b-row align-v="center" style="height: 100%">
            <b-col lg="6" md="8" class="center-align-xs">
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

    public finish(e: { id: string }) {
        this.file = null;
        this.$router.push("/copy/" + e.id);
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

#file-upload-label {
    margin-top: 5px;
}

label {
    cursor: pointer;
}
</style>
