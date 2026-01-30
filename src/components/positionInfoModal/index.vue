<!--
 * @Author: hupaocai 13767071930@163.com
 * @Date: 2024-11-25 18:04:29
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-11-25 18:37:42
 * @FilePath: /mcm-web/src/components/positionInfoModal/index.vue
 * @Description: 岗位输入框
-->
<template>
    <div class="w-[100%]">
        <el-input v-model="localValue" placeholder="请选择" :readonly="props.readonly" :disabled="props.disabled" style="width: 100%" clearable @input="input" @clear="clear">
            <template #suffix>
                <span style="cursor: pointer" @click="accountMaterClick">
                    <el-icon class="el-input__icon">
                        <Search />
                    </el-icon>
                </span>
            </template>
        </el-input>
        <PositionInfoDialog v-model="visible" @submit="submit" />
    </div>
</template>

<script setup lang="jsx" name="positionInfoModal">
    // import { productNumberByNumber } from './services';
    import PositionInfoDialog from '@/components/positionInfoDialog/index.vue';
    import { watch } from 'vue';
    const props = defineProps({
        modelValue: {
            type: String,
            default: '',
        },
        readonly: {
            type: Boolean,
            default: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        }
    });

    // 本地数据
    const localValue = ref('');

    watch(
        () => props.modelValue,
        (nV) => {
            localValue.value = nV;
        },
    );

    const emit = defineEmits();
    const { proxy } = getCurrentInstance();
    // 项目号弹窗
    const visible = ref(false);

    function input(v) {
        emit('update:modelValue', v);
    }
    // 打开项目
    function accountMaterClick() {
        visible.value = true;
    }

    function clear(v) {
        emit('clear');
    }

    // // 项目回车查询
    // function projectNumberEnter() {
    //     // 判断项目是否存在
    //     exitProject(props.modelValue);
    // }

    // 选择项目
    function submit(r) {
        console.log(r);
        visible.value = false;
        emit('update:modelValue', r.functionCode);
        emit('submit', r);
    }
</script>