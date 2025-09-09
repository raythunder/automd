<script setup lang="ts">
const props = defineProps<{
    options: string[];
    modelValue: number;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: number];
}>();

const onChange = (index: number) => {
    emit('update:modelValue', index);
};
</script>

<template>
    <div class="radio-group">
        <label 
            v-for="(option, index) in options" 
            :key="index" 
            class="radio-option"
            :class="{ 'active': modelValue === index }"
        >
            <input 
                type="radio" 
                :value="index" 
                :checked="modelValue === index"
                @change="onChange(index)"
                class="radio-input"
            />
            <span class="radio-label">{{ option }}</span>
        </label>
    </div>
</template>

<style scoped>
.radio-group {
    display: flex;
    gap: 16px;
    padding: 8px 0;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
    border: 1px solid #ddd;
    background-color: #fff;
    font-size: 14px;
    color: #333;
}

.radio-option:hover {
    border-color: #4b92d9;
    background-color: #f0f8ff;
}

.radio-option.active {
    border-color: #4b92d9;
    background-color: #4b92d9;
    color: white;
}

.radio-option.active:hover {
    background-color: #3a7bc8;
    border-color: #3a7bc8;
}

.radio-input {
    width: 16px;
    height: 16px;
    accent-color: #4b92d9;
    cursor: pointer;
}

.radio-option.active .radio-input {
    accent-color: white;
}

.radio-label {
    user-select: none;
    white-space: nowrap;
    font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 300px) {
    .radio-group {
        flex-direction: column;
        gap: 8px;
    }
    
    .radio-option {
        justify-content: flex-start;
    }
}
</style>