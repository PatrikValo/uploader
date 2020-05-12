<template>
    <h5
        :class="{ 'text-truncate': truncate }"
        class="text-break"
        @mouseover="over"
        @mouseleave="leave"
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
    private truncate: boolean = true;

    public constructor() {
        super();
    }

    public over() {
        this.truncate = false;
    }

    public leave() {
        this.truncate = true;
    }
}
</script>
<style scoped>
h5 {
    margin-bottom: 0;
}
</style>
