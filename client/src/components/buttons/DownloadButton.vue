<template>
    <b-button variant="warning" :disabled="downloading" @click="download">{{ name }}</b-button>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({})
export default class DownloadButton extends Vue {
    public downloading: boolean = false;

    public constructor() {
        super();
    }

    get name() {
        return this.downloading ? "Sťahovanie..." : "Stiahnuť súbor";
    }

    public download(e: any) {
        this.downloading = true;
        this.$emit("download", e);
    }
}
</script>
