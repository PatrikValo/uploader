<template>
    <div>
        <b-button
            variant="warning"
            @click="click"
            :title="name"
            :disabled="disabled"
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
    private stop: boolean = false;

    public constructor() {
        super();
    }

    get name() {
        return this.$props.downloading ? "Zrušiť" : "Stiahnuť súbor";
    }

    get disabled() {
        if (!this.$props.downloading) {
            this.stop = false;
            return false;
        }

        return this.stop;
    }

    public click(e: any) {
        if (this.$props.downloading) {
            return this.cancel(e);
        }

        return this.download(e);
    }

    public download(e: any) {
        this.$emit("download", e);
    }

    public cancel(e: any) {
        this.stop = true;
        this.$emit("cancel", e);
    }
}
</script>
