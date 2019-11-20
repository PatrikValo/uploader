<template>
    <div>
        <b-alert v-if="emptyPassword" show variant="warning" fade
            >Heslo nesmie byť prázdné</b-alert
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
import Config from "../ts/config";
import Component from "vue-class-component";
import ProgressBar from "./ProgressBar.vue";
import SizeIndicator from "./SizeIndicator.vue";
import UploadFile from "../ts/uploadFile";
import Utils from "../ts/utils";
import Vue from "vue";
import FileName from "./FileName.vue";
import FileIcon from "./FileIcon.vue";
import FileInfo from "./FileInfo.vue";
import PasswordToggle from "./PasswordToggle.vue";
import UploadButton from "./UploadButton.vue";
import Limiter from "../ts/limiter";

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
        file: File
    }
})
export default class UploadArea extends Vue {
    public startUploading: boolean = false;
    public uploaded: number = 0;
    public hasPassword: boolean = false;
    private uploader: UploadFile | null = null;
    private password: string = "";

    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        // control of size limit
        const limiter = new Limiter();
        if (!limiter.validateFileSize(this.$props.file)) {
            this.$emit("limit");
        }
    }

    public async upload(event: (v: boolean) => any): Promise<void> {
        if (!this.validatePassword(event)) {
            return;
        }

        this.uploader = new UploadFile(
            this.$props.file,
            Utils.server.websocketUrl("/api/upload"),
            this.hasPassword ? this.password : undefined
        );

        this.startUploading = true;

        try {
            const result = await this.uploader.upload(this.onProgress);
            if (!result.id) {
                this.$emit("cancel");
                return;
            }
            this.$emit("finish", result);
        } catch (e) {
            this.$emit("error", new Error("Error during sending file"));
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

    public get emptyPassword() {
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
        closeButton(true);
        return true;
    }
}
</script>
