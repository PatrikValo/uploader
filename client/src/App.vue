<template>
    <div
        class="h-100 w-100"
        :class="{ 'dropbox-theme': isLoggedIn, 'classic-theme': !isLoggedIn }"
    >
        <login-button :auth="auth" @click="click"></login-button>
        <router-view :auth="auth" style="padding-top: 50px"></router-view>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import LoginButton from "./components/LoginButton.vue";
import AuthDropbox from "./ts/authDropbox";

@Component({
    components: { LoginButton }
})
export default class App extends Vue {
    public isLoggedIn: boolean;
    public auth: AuthDropbox;

    public constructor() {
        super();
        this.auth = new AuthDropbox();
        this.isLoggedIn = this.auth.isLoggedIn();

        // login/logout event
        this.auth.on("changeStatus", this.changeStatus);
    }

    public click() {
        if (this.auth.isLoggedIn()) {
            return this.$router.push("/logout");
        }

        location.href = this.auth.getAuthUrl();
    }

    public changeStatus(isLoggedIn: boolean) {
        this.isLoggedIn = isLoggedIn;
    }
}
</script>
