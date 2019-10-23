<template>
    <div>
        <h1>Download</h1>
        <h2 @click="hello">ahoj</h2>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({})
export default class Download extends Vue {
    public constructor() {
        super();
    }

    hello() {
        console.log(this.$route.hash);
    }
}
</script>
