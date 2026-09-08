<template>
    <div class="admin-layout">
        <MenuRocker />

        <main class="admin-main">
            <TopRocker />

            <div class="admin-content">
                <slot></slot>
            </div>
        </main>
    </div>
</template>

<script>
import MenuRocker from "../../components/Admin/MenuRocker.vue";
import TopRocker from "../../components/Admin/TopRocker.vue";

export default {
    name: "LayoutAdmin",

    components: {
        MenuRocker,
        TopRocker
    }
}
</script>

<style scoped>
.admin-layout {
    display: flex;
    min-height: 100vh;
    background: linear-gradient(135deg, #eaf9fb 0%, #f7feff 60%, #f4f3ff 100%);
}

.admin-main {
    flex: 1;
    min-width: 0;
}

.admin-content {
    width: 100%;
    padding: 26px 28px 50px;
}
</style>