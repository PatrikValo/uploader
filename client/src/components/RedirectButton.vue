<template>
    <b-button variant="dark" @click="redirect">{{ title }}</b-button>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({
    props: {
        title: String,
        to: String
    }
})
export default class RedirectButton extends Vue {
    public constructor() {
        super();
    }

    public redirect() {
        this.$router.push(this.$props.to);
    }
}
</script>
