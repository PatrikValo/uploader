<template>
    <div>
        <b-alert v-if="emptyPassword" show variant="warning"
            >Heslo nemôže byť prázdne</b-alert
        >
        <file-info :name="file.name" :size="file.size"></file-info>
        <password-toggle
            v-if="!startUploading"
            @input="changePassword"
            @toggle="togglePassword"
        ></password-toggle>
        <progress-bar
            v-if="startUploading"
            :uploaded="uploaded"
            :total="file.size"
        ></progress-bar>
        <upload-button @upload="upload" @cancel="cancelUpload"></upload-button>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import ProgressBar from "./ProgressBar.vue";
import SizeIndicator from "./SizeIndicator.vue";
import IUploadFile from "../ts/interfaces/IUploadFile";
import { UploadFileServer, UploadFileDropbox } from "../ts/uploadFile";
import Vue from "vue";
import FileName from "./FileName.vue";
import FileIcon from "./FileIcon.vue";
import FileInfo from "./FileInfo.vue";
import PasswordToggle from "./PasswordToggle.vue";
import UploadButton from "./UploadButton.vue";
import Limiter from "../ts/limiter";
import AuthDropbox from "../ts/authDropbox";

@Component({
    components: {
        UploadButton,
        PasswordToggle,
        FileInfo,
        FileIcon,
        FileName,
        ProgressBar,
        SizeIndicator
    },
    props: {
        file: File,
        auth: AuthDropbox
    }
})
export default class UploadArea extends Vue {
    private startUploading: boolean = false;
    private uploaded: number = 0;
    private hasPassword: boolean = false;
    private uploader: IUploadFile | null = null;
    private password: string = "";

    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        // control of size limit
        const limiter = new Limiter();
        const file: File = this.$props.file;
        if (!limiter.validateFileSize(file.size)) {
            this.$emit("limit");
        }
    }

    public async upload(event: (v: boolean) => any): Promise<void> {
        if (!this.validatePassword(event)) {
            return;
        }

        if (this.$props.auth.isLoggedIn()) {
            this.uploader = new UploadFileDropbox(
                this.$props.file,
                this.$props.auth,
                this.hasPassword ? this.password : undefined
            );
        } else {
            this.uploader = new UploadFileServer(
                this.$props.file,
                this.hasPassword ? this.password : undefined
            );
        }

        this.startUploading = true;

        try {
            const result = await this.uploader.upload(this.onProgress);
            if (!result.id) {
                this.$emit("cancel");
                return;
            }
            this.$emit("finish", result);
        } catch (e) {
            this.$emit("error", e);
        }
    }

    public cancelUpload(): void {
        if (this.uploader) {
            this.uploader.cancel();
        }
    }

    public changePassword(password: string): void {
        this.password = password;
    }

    public togglePassword(value: boolean): void {
        this.hasPassword = value;
        this.password = "";
    }

    get emptyPassword() {
        return this.hasPassword && !this.password;
    }

    private onProgress(uploaded: number): void {
        this.uploaded += uploaded;
    }

    private validatePassword(closeButton: (v: boolean) => any): boolean {
        if (this.emptyPassword) {
            closeButton(false);
            return false;
        }

        if (this.password.length > 25) {
            closeButton(false);
            return false;
        }

        closeButton(true);
        return true;
    }
}
</script>
