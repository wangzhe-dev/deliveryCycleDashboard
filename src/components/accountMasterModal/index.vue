<!--
 * @Author: heqi
 * @Date: 2023-09-07 14:20:50
 * @LastEditTime: 2023-09-07 17:28:49
 * @Description: 财务科目主数据放大镜
-->

<template>
    <div class="w-[100%]">
        <el-input v-model="localValue" placeholder="请选择" style="width: 100%" clearable @input="input">
            <template #suffix>
                <span style="cursor: pointer" @click="accountMaterClick">
                    <el-icon class="el-input__icon">
                        <Search />
                    </el-icon>
                </span>
            </template>
        </el-input>
        <AccountMasterDialog v-model="visible" @submit="submit" />
    </div>
</template>

<script setup lang="jsx" name="accountMasterModal">
    // import { productNumberByNumber } from './services';
    import AccountMasterDialog from '@/components/accountMasterDialog/index.vue';
    import { watch } from 'vue';
    const props = defineProps({
        modelValue: {
            type: String,
            default: '',
        },
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

    // // 项目回车查询
    // function projectNumberEnter() {
    //     // 判断项目是否存在
    //     exitProject(props.modelValue);
    // }

    // 选择项目
    function submit(r) {
        console.log(r);
        visible.value = false;
        emit('update:modelValue', r.fullNameSubject);
        emit('submit', r);
    }
</script>