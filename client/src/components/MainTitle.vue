<template>
    <h1 class="display-4 font-weight-bold">{{ title }}</h1>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({
    props: {
        title: String
    }
})
export default class MainTitle extends Vue {
    public constructor() {
        super();
    }
}
</script>
<style scoped>
h1 {
    padding: 10px 0 10px 0;
}
</style>
