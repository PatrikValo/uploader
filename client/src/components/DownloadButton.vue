<template>
    <div>
        <b-button
            variant="warning"
            :disabled="downloading"
            @click="download"
            :title="name"
            >{{ name }}</b-button
        >
        <redirect-button v-if="!downloading" title="+" to="/"></redirect-button>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import RedirectButton from "./RedirectButton.vue";

@Component({
    components: { RedirectButton }
})
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
