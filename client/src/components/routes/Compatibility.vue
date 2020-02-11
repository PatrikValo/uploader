<template>
    <b-container class="h-100">
        <b-row align-v="center" class="h-100">
            <b-col lg="6" md="8" class="text-center">
                <main-title title="Prehliadač nie je podporovaný"></main-title>
                <b-button
                    variant="warning"
                    href="https://www.google.com/chrome/"
                    >Stiahnuť Chrome</b-button
                >
            </b-col>
            <b-col lg="6" md="4" class="d-none d-sm-none d-md-block">
                <plane-image></plane-image>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
import PlaneImage from "../PlaneImage.vue";

@Component({
    components: { PlaneImage, MainTitle }
})
export default class Compatibility extends Vue {
    public constructor() {
        super();
    }
}
</script>
