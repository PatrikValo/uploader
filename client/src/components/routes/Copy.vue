<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Kopírovať odkaz"></main-title>
                <div v-html="qrContent()"></div>
                <b-input id="input" v-model="url" readonly></b-input>
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
import qrcode from "qrcode-generator";

@Component({
    components: { PlaneImage, RedirectButton, CopyButton, MainTitle }
})
export default class Copy extends Vue {
    public constructor() {
        super();
    }

    public qrContent() {
        const qr = qrcode(0, "L");
        qr.addData(this.url);
        qr.make();
        return qr.createImgTag(4);
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
        let id = this.$route.params.id;
        const sharing = this.$route.params.sharing;
        const destination = this.$route.params.destination;

        id = sharing ? sharing + "/" + id : id;
        return Utils.buildUrl(destination, id, key);
    }

    get path(): string {
        let key = this.key();
        let id = this.$route.params.id;
        const sharing = this.$route.params.sharing;
        const destination = this.$route.params.destination;

        id = sharing ? sharing + "/" + id : id;
        return Utils.buildPath(destination, id, key);
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
