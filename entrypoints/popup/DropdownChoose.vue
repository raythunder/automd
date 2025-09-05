<script setup lang="ts">
import DropdownMenu from './DropdownMenu.vue';

const props = defineProps<{
    position?: "left" | "right";
    isgrid?: boolean;
    states?: string[];
    state: string;
}>();

const emit = defineEmits<{
    choose: [index: number];
}>();

const onChoose = (index: number) => {
    emit('choose', index);
};
</script>

<template>
    <DropdownMenu :position="position" :isgrid="isgrid">
        <template #btn>
            <div class="state">
                {{ state }}
                <svg width="20" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M36 18L24 30L12 18" stroke="#fff" stroke-width="3" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </div>
        </template>
        <template #btns>
            <span v-for="(item, index) in states" :key="index" @click="onChoose(index)">{{ item }}</span>
        </template>
    </DropdownMenu>
</template>

<style scoped>
.state {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    color: white;
    white-space: nowrap;
    font-size: 14px;
    min-width: 100px;
}

.state svg {
    margin-left: 8px;
    flex-shrink: 0;
}
</style>