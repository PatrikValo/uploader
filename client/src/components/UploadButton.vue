<template>
    <div>
        <b-button
            variant="warning"
            v-if="uploadButton"
            @click="upload"
            title="Nahrať súbor"
            >Nahrať súbor</b-button
        >
        <b-button
            variant="warning"
            v-if="!uploadButton"
            :disabled="cancelButton"
            @click="cancel"
            >{{ name }}</b-button
        >
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({})
export default class UploadButton extends Vue {
    public uploadButton: boolean = true;
    public cancelButton: boolean = false;

    public constructor() {
        super();
    }

    get name() {
        return this.cancelButton ? "Nahrávanie sa ruší..." : "Zastaviť";
    }

    public upload(e: any): void {
        this.uploadButton = false;
        this.$emit("upload", e);
    }

    public cancel(e: any): void {
        this.cancelButton = true;
        this.$emit("cancel", e);
    }
}
</script>
