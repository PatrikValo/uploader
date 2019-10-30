<template>
    <h6>{{ computedSize }}</h6>
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
        if (this.$props.size < 1000) {
            return this.$props.size + " B";
        }

        if (this.$props.size < 1000000) {
            return Math.round(this.$props.size / 100) / 10 + " kB";
        }

        if (this.$props.size < 1000000000) {
            return Math.round(this.$props.size / 100000) / 10 + " MB";
        }

        if (this.$props.size < 1000000000000) {
            return Math.round(this.$props.size / 100000000) / 10 + " GB";
        }

        return Math.round(this.$props.size / 100000000000) / 10 + " TB";
    }
}
</script>
