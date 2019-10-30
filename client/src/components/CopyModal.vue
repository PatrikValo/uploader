<template> </template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({
    props: {
        id: String
    }
})
export default class CopyModal extends Vue {
    private readonly base: string;
    private copy: boolean = false;

    public constructor() {
        super();
        this.base = "localhost:8080/";
    }

    get show() {
        return true;
    }

    get info() {
        return this.copy ? "Copied!" : "CopyModal.vue";
    }

    public copyToClipboard() {
        const el = document.createElement("textarea");
        el.value = this.$props.id;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        this.copy = true;
    }
}
</script>
