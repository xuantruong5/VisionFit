<template>
    <div class="blank-layout">
        <slot></slot>
    </div>
</template>

<script>
export default {
    name: "LayoutBlank"
}
</script>

<style scoped>
.blank-layout {
    min-height: 100vh;
}
</style>