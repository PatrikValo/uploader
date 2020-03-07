<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Nahrať súbor"></main-title>
                <b-alert v-if="alert" show variant="warning">{{
                    alert
                }}</b-alert>
                <b-row v-if="!file" align-v="center">
                    <b-col>
                        <upload-image></upload-image>
                    </b-col>
                </b-row>
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
                    @click="clearAlert"
                    >Vybrať súbor</label
                >
                <upload-area
                    v-if="file"
                    :file="file"
                    :auth="auth"
                    @finish="finish"
                    @error="error"
                    @cancel="cancel"
                    @limit="limit"
                ></upload-area>
            </b-col>
            <b-col lg="6" md="4" class="d-none d-sm-none d-md-block">
                <plane-image></plane-image>
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
import { UploadCompatibility } from "../../ts/compatibility";
import PlaneImage from "../PlaneImage.vue";
import AuthDropbox from "../../ts/authDropbox";
import UploadImage from "../UploadImage.vue";
import Config from "../../ts/config";

@Component({
    components: { UploadImage, PlaneImage, UploadArea, MainTitle },
    props: {
        auth: AuthDropbox
    }
})
export default class Upload extends Vue {
    private file: File | null;
    private alert: string;

    public constructor() {
        super();
        this.file = null;
        this.alert = "";
    }

    // noinspection JSUnusedGlobalSymbols
    mounted() {
        if (!UploadCompatibility.isCompatible()) {
            this.$router.push("/compatibility");
        }

        document.body.ondragover = function(e) {
            e.preventDefault();
        };

        document.body.ondrop = this.onDrop;
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
        this.alert = "Počas nahrávania nastala chyba";
        console.error("Nastala chyba!", e);
        this.file = null;
    }

    public cancel(): void {
        this.file = null;
    }

    public limit(): void {
        this.file = null;
        const gb = 1024 * 1024 * 1024;
        this.alert = `Veľkosť súboru presahuje ${
            this.$props.auth.isLoggedIn()
                ? Config.client.fileSizeLimitDropbox / gb
                : Config.client.fileSizeLimit / gb
        }GB`;
    }

    public clearAlert(): void {
        this.alert = "";
    }

    public onDrop(e: DragEvent) {
        e.preventDefault();
        this.clearAlert();
        if (e.dataTransfer && e.dataTransfer.files.length === 1) {
            this.file = e.dataTransfer.files[0];
        }
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
    margin-top: 20px;
}

label {
    cursor: pointer;
}
</style>
