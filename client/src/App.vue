<template>
    <router-view></router-view>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class App extends Vue {
    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        // middleware control of compatibility
    }
}
</script>

<style scoped>
@import "./style/css.css";
@import url("https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap");
* {
    font-family: "Roboto", sans-serif;
}
</style>
