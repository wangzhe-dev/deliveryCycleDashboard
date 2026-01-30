<!--
 * @Author: zhaijinsong
 * @Date: 2023-10-08 10:04:26
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-10-16 15:17:50
 * @Description: 规则维护
-->
<template>
  <el-dialog
    title="规则维护"
    v-model="open"
    width="640"
    append-to-body
    @close="cancel"
    :close-on-click-modal="false"
  >
    <div>
      <WsllForm
        :formData="formData"
        :formColumns="formColumns"
        :formRules="formRules"
        label-width="110px"
        ref="wsllFormRef"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="type === 'add'" type="primary" @click="submitForm(true)">
          保存并新建下一条
        </el-button>
        <el-button type="primary" @click="submitForm()">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup name="AEDialog">
import _ from 'lodash';
import { addList, updateList } from '../services';
import { assignFormData } from '@/utils/utils';

const { proxy } = getCurrentInstance();
const { alarm_rule_type } = proxy.useDictList(['alarm_rule_type']);
const emit = defineEmits(['refresh']);
const type = ref('');
const open = ref(false);
let cloneData = {};
const wsllFormRef = ref(null);
const formData = reactive({
  subType: '',
  ruleCode: '',
  ruleName: '',
});
const formRules = reactive({
  subType: [{ required: true, message: '必填项', trigger: 'blur' }],
  ruleCode: [{ required: true, message: '必填项', trigger: 'blur' }],
  ruleName: [{ required: true, message: '必填项', trigger: 'blur' }],
});

const formColumns = reactive([
  {
    xType: 'Select',
    label: '订阅类型',
    prop: 'subType',
    options: alarm_rule_type,
    span: 24,
  },
  {
    xType: 'Input',
    label: '规则编码',
    prop: 'ruleCode',
    disabled: false,
    span: 24,
  },
  {
    xType: 'Input',
    label: '规则名称',
    prop: 'ruleName',
    span: 24,
  },
]);
const openDialog = (key, row) => {
  open.value = true;
  type.value = key;
  // 禁用
  formColumns[1].disabled = key === 'edit';
  formColumns[0].disabled = key === 'edit';

  if (key === 'edit') {
    cloneData = _.cloneDeep(row || {});
    nextTick(() => {
      assignFormData(formData, cloneData);
    });
  }
};
/** 表单重置 */
const reset = () => {
  cloneData = {};
  wsllFormRef.value?.formRef?.resetFields();
};
/** 取消按钮 */
const cancel = () => {
  reset();
  open.value = false;
};
/** 提交按钮 */
const submitForm = (nextType = false) => {
  wsllFormRef.value?.formRef?.validate(async (valid) => {
    if (valid) {
      if (type.value === 'edit') {
        const params = {
          ...formData,
          id: cloneData.id,
        };

        const res = await updateList(params);
        proxy.responseMsg(res).then(() => {
          cancel();
          emit('refresh', 'edit');
        });
      } else {
        const res = await addList({ ...formData });
        proxy.responseMsg(res).then(() => {
          emit('refresh', 'add');
          if (nextType) {
            reset();
            return;
          }
          cancel();
        });
      }
    }
  });
};

defineExpose({
  openDialog,
});
</script>
