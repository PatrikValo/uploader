<template>
    <div>
        <b-badge
            id="add-password"
            :variant="show ? 'secondary' : 'dark'"
            @click="toggle"
            >{{ name }}</b-badge
        >
        <b-input
            v-if="show"
            id="password"
            placeholder="Heslo"
            type="password"
            maxlength="25"
            @input="change"
        />
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({})
export default class PasswordToggle extends Vue {
    private show: boolean = false;

    public constructor() {
        super();
    }

    get name() {
        return this.show ? "Odobrať heslo" : "Pridať heslo";
    }

    public toggle() {
        this.show = !this.show;
        this.$emit("toggle", this.show);
    }

    public change(password: string) {
        this.$emit("input", password);
    }
}
</script>
<style scoped>
#add-password {
    cursor: pointer;
}

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
