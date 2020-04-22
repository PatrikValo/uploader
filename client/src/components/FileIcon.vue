<template>
    <div>
        <div class="icon">
            <p class="icon-format">{{ format }}</p>
            <img src="../assets/file.svg" width="50px" alt="File Icon" />
        </div>
    </div>
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

    get format() {
        const name: string = this.$props.name;
        const arr = name.split(".");
        if (arr.length < 2) {
            return "file";
        }

        const format = arr.pop();

        return !format || format.length > 7 ? "file" : "." + format;
    }
}
</script>
<style scoped>
.icon-format {
    margin-bottom: -42px;
    padding: 1px 5px 1px 5px;
    text-align: center;
    border-radius: 0.25rem;
    position: relative;
    z-index: 2;
}

.icon {
    padding: 10px 0 15px 0;
    width: 75px;
    margin-left: auto;
    margin-right: auto;
}

img {
    position: relative;
}
</style>
