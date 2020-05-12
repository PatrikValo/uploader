<template>
    <p class="text-muted">{{ computedSize }}</p>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({
    props: {
        size: Number
    }
})
export default class SizeIndicator extends Vue {
    get computedSize() {
        const { size } = this.$props;
        if (size < 1024) {
            return size + " B";
        }

        if (size < 1024 * 1024) {
            return Math.round((size / 1024) * 10) / 10 + " kB";
        }

        if (size < 1024 * 1024 * 1024) {
            return Math.round((size / (1024 * 1024)) * 10) / 10 + " MB";
        }

        if (this.$props.size < 1024 * 1024 * 1024 * 1024) {
            return Math.round((size / (1024 * 1024 * 1024)) * 10) / 10 + " GB";
        }

        return (
            Math.round((size / (1024 * 1024 * 1024 * 1024)) * 10) / 10 + " TB"
        );
    }
}
</script>
<style scoped>
p {
    margin: 0;
}
</style>
