<template>
    <div
        class="modal-backdrop text-center d-flex align-items-center justify-content-center"
    >
        <b-spinner
            variant="warning"
            style="width: 5rem; height: 5rem;"
            label="Large Spinner"
            type="grow"
        ></b-spinner>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({})
export default class LoadingPage extends Vue {}
</script>
<style scoped>
.modal-backdrop {
    opacity: 1;
    background-color: white;
}
</style>
