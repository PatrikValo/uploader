<template>
    <h5
        :class="{ 'text-truncate': truncate }"
        class="text-break"
        @click="click"
    >
        {{ name }}
    </h5>
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
    public truncate: boolean = true;

    public constructor() {
        super();
    }

    public click() {
        this.truncate = !this.truncate;
    }
}
</script>
<style scoped>
h5 {
    margin-bottom: 0;
}
</style>
