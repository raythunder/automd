<script setup lang="ts">
interface Tab {
    id: string;
    label: string;
    icon?: string;
}

const props = defineProps<{
    tabs: Tab[];
    activeTab: string;
}>();

const emit = defineEmits<{
    'tab-change': [tabId: string];
}>();

const handleTabClick = (tabId: string) => {
    if (tabId !== props.activeTab) {
        emit('tab-change', tabId);
    }
};

const activeTabIndex = computed(() => {
    return props.tabs.findIndex(tab => tab.id === props.activeTab);
});
</script>

<template>
    <div class="tab-switcher">
        <div class="tab-list">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                class="tab-button"
                :class="{ 'active': tab.id === activeTab }"
                @click="handleTabClick(tab.id)"
            >
                <span v-if="tab.icon" class="tab-icon">{{ tab.icon }}</span>
                <span class="tab-label">{{ tab.label }}</span>
            </button>
        </div>
        <div class="tab-indicator" :style="{ transform: `translateX(${activeTabIndex * 100}%)` }"></div>
    </div>
</template>

<style scoped>
.tab-switcher {
    position: relative;
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 20px;
}

.tab-list {
    display: flex;
    position: relative;
    z-index: 2;
}

.tab-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: #6c757d;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.3s ease;
    border-radius: 6px;
    position: relative;
}

.tab-button:hover:not(.active) {
    color: #495057;
    background-color: rgba(108, 117, 125, 0.1);
}

.tab-button.active {
    color: #4b92d9;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-icon {
    font-size: 16px;
}

.tab-label {
    white-space: nowrap;
    user-select: none;
}

.tab-indicator {
    position: absolute;
    bottom: 4px;
    left: 4px;
    right: 4px;
    height: calc(100% - 8px);
    background-color: white;
    border-radius: 6px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1;
    width: calc(50% - 4px);
}

/* 响应式适配 */
@media (max-width: 400px) {
    .tab-button {
        flex-direction: column;
        gap: 4px;
        padding: 8px 12px;
    }
    
    .tab-label {
        font-size: 12px;
    }
    
    .tab-icon {
        font-size: 14px;
    }
}
</style>