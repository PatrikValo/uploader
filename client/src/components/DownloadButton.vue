<template>
    <div>
        <b-button
            variant="warning"
            :disabled="downloading"
            @click="download"
            :title="name"
            ><b-spinner v-if="downloading" small type="grow"></b-spinner
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
    props: {
        downloading: Boolean
    },
    components: { RedirectButton }
})
export default class DownloadButton extends Vue {
    public constructor() {
        super();
    }

    get name() {
        return this.$props.downloading ? "Sťahovanie..." : "Stiahnuť súbor";
    }

    public download(e: any) {
        this.$emit("download", e);
    }
}
</script>
