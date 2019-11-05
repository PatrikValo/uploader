<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Súbor už neexistuje"></main-title>
                <redirect-button
                    title="Hlavná stránka"
                    to="/"
                ></redirect-button>
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
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
import RedirectButton from "../buttons/RedirectButton.vue";
@Component({
    components: { RedirectButton, MainTitle }
})
export default class NotFound extends Vue {
    public constructor() {
        super();
    }
}
</script>
