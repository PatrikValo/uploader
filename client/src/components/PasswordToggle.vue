<template>
    <div>
        <b-badge
            id="add-password"
            :variant="show ? 'secondary' : 'dark'"
            @click="toggle"
            >{{ name }}</b-badge
        >
        <password-input v-if="show"></password-input>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import PasswordInput from "./PasswordInput.vue";

@Component({
    components: { PasswordInput }
})
export default class PasswordToggle extends Vue {
    public show: boolean = false;

    public constructor() {
        super();
    }

    get name() {
        return this.show ? "Odobrať heslo" : "Pridať heslo";
    }

    public toggle() {
        this.show = !this.show;
    }
}
</script>
<style scoped>
#add-password {
    cursor: pointer;
}
</style>
