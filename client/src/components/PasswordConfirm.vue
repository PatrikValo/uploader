<template>
    <div>
        <b-input
            id="password"
            placeholder="Heslo"
            type="password"
            v-model="password"
            maxlength="25"
            @focus="focus"
        />
        <b-button variant="warning" title="Potvrdiť" @click="confirm"
            >Potvrdiť</b-button
        >
        <redirect-button title="+" to="/"></redirect-button>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import RedirectButton from "./RedirectButton.vue";

@Component({
    components: { RedirectButton }
})
export default class PasswordConfirm extends Vue {
    public password: string = "";

    public constructor() {
        super();
    }

    public confirm(): void {
        if (this.password && this.password.length > 25) {
            this.password = "";
            return;
        }

        this.$emit("confirm", this.password);
        this.password = "";
    }

    public focus() {
        this.$emit("focus");
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
