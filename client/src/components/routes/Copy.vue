<template>
    <b-container style="height: 100%">
        <b-row align-v="center" style="height: 100%">
            <b-col lg="6" md="8">
                <h1 class="display-3 font-weight-bold">Copy Url</h1>
                <b-input id="input" v-model="url"></b-input>
                <b-button variant="warning" @click="copyToClipboard">{{
                    info
                }}</b-button>
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
import Utils from "../../ts/utils";
import Vue from "vue";

@Component
export default class Copy extends Vue {
    private copy: boolean = false;

    public constructor() {
        super();
    }

    get info(): string {
        return this.copy ? "Copied!" : "Copy";
    }

    get url(): string {
        return Utils.buildUrl(this.$route.params.id, this.$route.hash);
    }

    public copyToClipboard() {
        let el = document.getElementById("input") as HTMLInputElement;
        el.select();
        el.setSelectionRange(0, 99999);
        document.execCommand("copy");
        this.copy = true;
    }
}
</script>
<style scoped>
#input {
    margin: 10px 0 10px 0;
}
#input:focus {
    border-color: #ffc107;
    box-shadow: 0 0 0 0.2rem rgba(222, 170, 12, 0.5);
}
</style>
