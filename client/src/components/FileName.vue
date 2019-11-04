<template>
    <h5 class="text-truncate">{{ name }}</h5>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({
    props: {
        name: String
    }
})
export default class FileName extends Vue {
    public constructor() {
        super();
    }
}
</script>
<style scoped>
h5 {
    margin-bottom: 0;
}
</style>
