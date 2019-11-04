<template>
    <div>
        <file-info :name="file.name" :size="file.size"></file-info>
        <password-toggle v-if="!startTime"></password-toggle>
        <progress-bar
            v-if="startTime"
            :uploaded="uploaded"
            :total="file.size"
        ></progress-bar>
        <remaining-time
            v-if="startTime"
            :size="file.size"
            :uploaded="uploaded"
        ></remaining-time>
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
import RemainingTime from "./RemainingTime.vue";

@Component({
    components: {
        RemainingTime,
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
    private uploader: UploadFile | null = null;
    public startTime: Date | null = null;
    public uploaded: number = 0;

    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        const file = this.$props.file;
        // control of size limit
        if (file.size > Config.client.fileSizeLimit) {
            this.$emit("limit");
        }
    }

    private onProgress(uploaded: number): void {
        this.uploaded += uploaded;
    }

    public async upload() {
        this.uploader = new UploadFile(
            this.$props.file,
            Utils.server.websocketUrl("/api/upload")
        );

        this.startTime = new Date();

        try {
            const id = await this.uploader.send(this.onProgress);
            if (!id) {
                return this.$emit("cancel");
            }
            return this.$emit("finish", { id });
        } catch (e) {
            return this.$emit("error", new Error("Error during sending file"));
        }
    }

    public cancelUpload(): void {
        if (this.uploader) {
            this.uploader.cancel();
        }
    }
}
</script>
