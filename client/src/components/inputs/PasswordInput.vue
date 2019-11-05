<template>
    <b-input
        id="password"
        placeholder="Heslo"
        type="password"
        @input="change"
    />
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({})
export default class PasswordInput extends Vue {
    public constructor() {
        super();
    }

    public change(password: string) {
        this.$emit("input", password);
    }
}
</script>
<style scoped>
#password {
    width: 200px;
    margin-left: auto;
    margin-right: auto;
}

#password:focus {
    border-color: #343a40;
    box-shadow: none;
}
</style>
