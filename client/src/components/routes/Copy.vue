<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Kopírovať odkaz"></main-title>
                <b-input id="input" v-model="url"></b-input>
                <copy-button :url="url"></copy-button>
                <redirect-button title="Stiahnuť" :to="path"></redirect-button>
                <redirect-button title="+" to="/"></redirect-button>
            </b-col>
            <b-col lg="6" md="4" class="d-none d-sm-none d-md-block">
                <plane-image></plane-image>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Utils from "../../ts/utils";
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
import RedirectButton from "../RedirectButton.vue";
import CopyButton from "../CopyButton.vue";
import PlaneImage from "../PlaneImage.vue";
@Component({
    components: { PlaneImage, RedirectButton, CopyButton, MainTitle }
})
export default class Copy extends Vue {
    public constructor() {
        super();
    }

    public key(): string {
        let key: string = this.$route.hash;
        if (key.length > 1) {
            key = key.substr(1);
        }
        return key;
    }

    get url(): string {
        let key = this.key();

        return Utils.buildUrl("download", this.$route.params.id, key);
    }

    get path(): string {
        let key = this.key();

        return Utils.buildPath("download", this.$route.params.id, key);
    }
}
</script>
<style scoped>
#input {
    margin: 10px 0 10px 0;
}

#input:focus {
    border-color: #343a40;
    box-shadow: none;
}
</style>
