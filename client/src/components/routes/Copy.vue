<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Kopírovať odkaz"></main-title>
                <b-input id="input" v-model="url"></b-input>
                <copy-button :url="url"></copy-button>
                <redirect-button title="+" to="/"></redirect-button>
            </b-col>
            <b-col lg="6" md="4" class="d-none d-sm-none d-md-block">
                <img id="image" src="../../assets/image.svg" alt="Paper planes" />
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Utils from "../../ts/utils";
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
import RedirectButton from "../buttons/RedirectButton.vue";
import CopyButton from "../buttons/CopyButton.vue";
@Component({
    components: { RedirectButton, CopyButton, MainTitle }
})
export default class Copy extends Vue {
    public constructor() {
        super();
    }

    get url(): string {
        let key: string = this.$route.hash;
        if (key.length > 1) {
            key = key.substr(1);
        }

        return Utils.buildUrl("download", this.$route.params.id, key);
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
