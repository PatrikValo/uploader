<template>
    <b-button variant="warning" @click="copyToClipboard" :title="name">{{
        name
    }}</b-button>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import copy from "copy-to-clipboard";

@Component({
    props: {
        url: String
    }
})
export default class CopyButton extends Vue {
    public copied: boolean = false;

    public constructor() {
        super();
    }

    get name(): string {
        return this.copied ? "Skopírované!" : "Kopírovať";
    }

    public copyToClipboard() {
        copy(this.$props.url);
        this.copied = true;
    }
}
</script>
