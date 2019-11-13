<template>
    <div>
        <file-icon :name="name"></file-icon>
        <file-name :name="name"></file-name>
        <size-indicator :size="size"></size-indicator>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import FileIcon from "./FileIcon.vue";
import FileName from "./FileName.vue";
import SizeIndicator from "./SizeIndicator.vue";

@Component({
    components: { SizeIndicator, FileName, FileIcon },
    props: {
        name: String,
        size: Number
    }
})
export default class FileInfo extends Vue {
    public constructor() {
        super();
    }
}
</script>
