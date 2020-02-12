<template>
    <svg
        version="1.1"
        x="0px"
        y="0px"
        height="90px"
        width="90px"
        viewBox="0 0 512 512"
    >
        <path
            fill="#ebebeb"
            d="M256,0C114.608,0,0,114.608,0,256s114.608,256,256,256s256-114.608,256-256S397.392,0,256,0z M256,496
			C123.664,496,16,388.336,16,256S123.664,16,256,16s240,107.664,240,240S388.336,496,256,496z"
        />
        <path
            class="st2"
            d="M261.12,140c-3.12-3.136-8.176-3.136-11.312,0l-3.008,3.008h-0.224v0.224l-97.504,97.504l11.312,11.312l86.192-86.192
			V390.48h16v-226.4l87.968,87.968l11.312-11.312L261.12,140z"
        />
    </svg>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({})
export default class UploadImage extends Vue {
    public constructor() {
        super();
    }
}
</script>
<style scoped>
svg {
    margin: 10px 0 10px 0;
}

.st2 {
    opacity: 0.75;
}
</style>
