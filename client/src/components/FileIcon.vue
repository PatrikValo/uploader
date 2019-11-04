<template>
    <div>
        <div class="icon">
            <p>{{ format }}</p>
            <img src="../assets/file.svg" width="50px" />
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
        let format: string | undefined = name.split(".").pop();
        if (format) {
            return format.length > 7 ? ".file" : "." + format;
        }
        return "file";
    }
}
</script>
<style scoped>
p {
    margin-bottom: -42px;
    background-color: #ffc107;
    padding: 1px 5px 1px 5px;
    text-align: center;
    border-radius: 0.25rem;
}
.icon {
    padding: 10px 0 15px 0;
    width: 75px;
    margin-left: auto;
    margin-right: auto;
}
img {
    z-index: -1;
    position: relative;
}
</style>
