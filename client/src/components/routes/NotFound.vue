<template>
    <b-container style="height: 100%">
        <b-row class="align-items-center" style="height: 640px">
            <div style="position: relative">
                <h1 class="display-4">Not Found</h1>
            </div>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class NotFound extends Vue {
    public constructor() {
        super();
    }
}
</script>
