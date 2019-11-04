<template>
    <b-container style="height: 100%">
        <b-row class="align-items-center" style="height: 640px">
            <b-col>
                <main-title title="Súbor už neexistuje"></main-title>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import MainTitle from "../MainTitle.vue";
@Component({
    components: { MainTitle }
})
export default class NotFound extends Vue {
    public constructor() {
        super();
    }
}
</script>
