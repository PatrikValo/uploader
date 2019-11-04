<template>
    <b-container style="height: 100%">
        <b-row class="align-items-center" style="height: 640px">
            <b-col>
                <h1 class="display-3 font-weight-bold">Súbor už neexistuje</h1>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component
export default class NotFound extends Vue {
    public constructor() {
        super();
    }
}
</script>
