<script setup lang="ts">
const props = defineProps<{
    position?: "left" | "right";
    isgrid?: boolean;
}>();

const isOpen = ref(false);

const toggleMenu = () => {
    isOpen.value = !isOpen.value;
};

// 点击外部关闭菜单
const menuRef = ref<HTMLElement>();
onMounted(() => {
    const handleClickOutside = (event: Event) => {
        if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
            isOpen.value = false;
        }
    };
    document.addEventListener('click', handleClickOutside);
    
    onBeforeUnmount(() => {
        document.removeEventListener('click', handleClickOutside);
    });
});
</script>

<template>
    <div class="dropdown-menu" ref="menuRef">
        <div class="dropdown-btn" @click="toggleMenu">
            <slot name="btn"></slot>
        </div>
        <div v-show="isOpen" class="dropdown-content" :class="{ 
            'position-left': position === 'left',
            'position-right': position === 'right',
            'grid-layout': isgrid
        }">
            <slot name="btns"></slot>
        </div>
    </div>
</template>

<style scoped>
.dropdown-menu {
    position: relative;
    display: inline-block;
}

.dropdown-btn {
    cursor: pointer;
    background-color: #4b92d9;
    border: none;
    border-radius: 6px;
    padding: 8px 12px;
    color: white;
    transition: background-color 0.2s;
}

.dropdown-btn:hover {
    background-color: #3a7bc8;
}

.dropdown-content {
    position: absolute;
    top: 100%;
    z-index: 1000;
    min-width: 120px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-top: 4px;
}

.dropdown-content :deep(span) {
    display: block;
    padding: 10px 16px;
    text-decoration: none;
    color: #333;
    cursor: pointer;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
    font-size: 14px;
}

.dropdown-content :deep(span:last-child) {
    border-bottom: none;
}

.dropdown-content :deep(span:hover) {
    background-color: #f5f5f5;
}

.position-left {
    right: 0;
    left: auto;
}

.position-right {
    left: 0;
    right: auto;
}

.grid-layout {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
}

.grid-layout :deep(span) {
    border-right: 1px solid #eee;
}

.grid-layout :deep(span:nth-child(even)) {
    border-right: none;
}
</style>