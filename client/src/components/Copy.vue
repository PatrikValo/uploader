<template>
    <div>
        <b-button variant="warning" @click="copyToClipboard">{{
            info
        }}</b-button>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({
    props: {
        id: String,
        hash: String
    }
})
export default class Copy extends Vue {
    private readonly base: string;
    private copy: boolean = false;

    public constructor() {
        super();
        this.base = "localhost:8080/";
    }

    async mounted() {
        this.$props.id = this.$route.params.id;
        this.$props.hash = this.$route.hash;
    }

    get url() {
        return this.base + this.$props.id + "/" + this.$props.hash;
    }

    get info() {
        return this.copy ? "Copied!" : "Copy";
    }

    public copyToClipboard() {
        const el = document.createElement("textarea");
        el.value = this.url;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        this.copy = true;
    }
}
</script>
