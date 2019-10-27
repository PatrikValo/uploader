<template>
    <div class="progress-bar-area">
        <b-progress
            :value="percentage"
            variant="warning"
            striped
            :animated="true"
            class="mt-2"
        ></b-progress>
        <div class="percentage">{{ percentage }}%</div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({
    props: {
        uploaded: Number,
        total: Number
    }
})
export default class ProgressBar extends Vue {
    public percentage: number = 0;
    private _interval: number = 0;

    public constructor() {
        super();
    }

    public mounted() {
        this._interval = setInterval(() => {
            if (this.percentage == 100) {
                clearInterval(this._interval);
            }
            const uploaded = this.$props.uploaded;
            const total = this.$props.total;
            this.percentage = Math.round((uploaded / total) * 100);
        }, 500);
    }
}
</script>
<style scoped>
.progress-bar-area {
    padding: 15px 0 15px 0;
}
.percentage {
    text-align: center;
}
</style>
