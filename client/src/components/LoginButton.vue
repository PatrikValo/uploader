<template>
    <div class="w-100" style="position: fixed; z-index: 10000">
        <div class="container text-right">
            <b-button
                v-if="!loggedIn"
                variant="outline-primary"
                size="sm"
                @click="click"
                title="Prihlásiť sa"
                >Dropbox</b-button
            >
            <b-dropdown
                v-if="loggedIn"
                right
                variant="outline-primary"
                size="sm"
            >
                <template slot="button-content">
                    <img v-if="link" :src="link" alt="Account photo" />
                    {{ name }}
                </template>
                <b-dropdown-item
                    variant="primary"
                    href="https://www.dropbox.com"
                    >Môj Dropbox</b-dropdown-item
                >
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item variant="secondary" @click="click"
                    >Odhlásiť sa</b-dropdown-item
                >
            </b-dropdown>
        </div>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import AuthDropbox from "../ts/authDropbox";

@Component({
    props: {
        auth: AuthDropbox
    }
})
export default class LoginButton extends Vue {
    public loggedIn: boolean = false;
    public name: string = "Načítava...";
    public link: string = "";

    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public async mounted() {
        const a: AuthDropbox = this.$props.auth;

        this.loggedIn = a.isLoggedIn();

        if (this.loggedIn) {
            await this.createAvatar();
        }

        // login/logout event
        a.on("changeStatus", this.changeStatus);
    }

    public click() {
        this.$emit("click");
    }

    public async changeStatus(isLoggedIn: boolean) {
        this.loggedIn = isLoggedIn;

        if (isLoggedIn) {
            this.createAvatar();
        }
    }

    public async createAvatar() {
        try {
            const a: AuthDropbox = this.$props.auth;
            const accountId = a.getAccountId();
            const u =
                "https://cfl.dropboxstatic.com/static/images/avatar/faceholder-vflmhyJKO.svg";
            const dbx = a.getDropboxObject();
            const result = await dbx.usersGetAccount({ account_id: accountId });
            this.name = result.name.display_name;
            this.link = result.profile_photo_url || u;
        } catch (e) {
            // something goes wrong with download information about user
            await this.$router.push("/logout");
        }
    }
}
</script>
<style scoped>
img {
    height: 20px;
    width: 20px;
    margin: -3px 3px 0 0;
    border-radius: 100%;
}
</style>
