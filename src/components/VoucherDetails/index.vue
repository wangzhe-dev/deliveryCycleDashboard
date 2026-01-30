<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-12 16:03:20
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-09-25 11:32:14
 * @Description: 凭证清单详情弹窗
-->
<template>
  <el-dialog append-to-body title="凭证清单详情" v-model="visible" width="80vw" @close="close">
    <el-form :model="formData" ref="formRef" label-width="110px" disabled>
      <el-row :gutter="24">
        <el-col :span="6">
          <el-form-item label="公司代码" prop="companyNumber">
            <el-select
              v-model="formData.companyNumber"
              placeholder=""
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="dict in companyList"
                :key="dict.companyCode"
                :label="dict.companyName"
                :value="dict.companyCode"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="凭证类型" prop="voucherBusinessTypeNumber">
            <el-select
              v-model="formData.voucherBusinessTypeNumber"
              placeholder=""
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="dict in voucherTypeList"
                :key="dict.code"
                :label="dict.name"
                :value="dict.code"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="凭证编号" prop="voucherNumber">
            <el-input
              v-model="formData.voucherNumber"
              clearable
              placeholder=""
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="凭证状态" prop="voucherStatusNumber">
            <el-select
              v-model="formData.voucherStatusNumber"
              placeholder=""
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="dict in financial_audit_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="凭证日期" prop="voucherDate">
            <el-date-picker
              v-model="formData.voucherDate"
              value-format="x"
              type="date"
              placeholder=""
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="过账日期" prop="postingDate">
            <el-date-picker
              v-model="formData.postingDate"
              value-format="x"
              type="date"
              placeholder=""
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="会计年度" prop="postingYear">
            <el-date-picker
              v-model="formData.postingYear"
              value-format="YYYY"
              type="year"
              placeholder=""
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="过账期间" prop="postingPeriod">
            <el-input v-model="formData.postingPeriod" placeholder="" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="币种" prop="currencyNumber">
            <el-select
              v-model="formData.currencyNumber"
              placeholder=""
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="dict in currency_code"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="参照" prop="referNumber">
            <el-input
              v-model="formData.referNumber"
              placeholder="请输入"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="抬头文本" prop="headerText">
            <el-input v-model="formData.headerText" placeholder="" clearable style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="冲销凭证号" prop="recoilVoucherNumber">
            <el-input
              v-model="formData.recoilVoucherNumber"
              placeholder=""
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="来源" prop="createMethod">
            <el-input
              v-model="formData.createMethod"
              placeholder=""
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :data="lineList"
        rowKey="id"
        :toolButton="false"
        :pagination="false"
      />
      <el-row class="lh50" :gutter="20">
        <el-col :span="4">
          制单人：
          <span>{{ formData.preparedByName }}</span>
        </el-col>
        <el-col :span="4">
          审核人：
          <span>{{ formData.reviewerName }}</span>
        </el-col>
        <el-col :span="4">
          过账人：
          <span>{{ formData.postingPersonName }}</span>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="close">返回</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="VoucherDetails">
import { findFinanceVoucherById, companyInfo, findVoucherTypeList } from './services';
import { assignFormData } from '@/utils/utils';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  checkType: {
    type: String,
    default: 'selection',
  },
  params: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:modelValue']);
const { proxy } = getCurrentInstance();
const { currency_code, financial_audit_status } = proxy.useDictList([
  'currency_code',
  'financial_audit_status',
]);
const visible = ref(false);
const lineList = ref([]);
const formData = ref({
  id: '', // String	主键
  createMethod: '', // 来源
  voucherBusinessTypeNumber: '', //	String	凭证业务类型编码
  voucherBusinessTypeName: '', //	String	凭证业务类型名称
  voucherStatusNumber: '', //	String	凭证业务状态 CREATE 创建 ，APPROVAL 审核中，AUDITED 已审核 ，CANCEL_REVIEW 取消审核，POST 过账 ； RECOIL 反冲
  voucherStatusName: '', //	String	凭证业务状态 CREATE 创建 ，APPROVAL 审核中，AUDITED 已审核 ，CANCEL_REVIEW 取消审核，POST 过账 ； RECOIL 反冲
  voucherTypeNumber: '', //	String	一期字段，不用
  voucherDocumentType: '', //	String	凭证单据类型
  postVoucherNumber: '', //	String	过账凭证号
  recoilVoucherNumber: '', //	String	冲销凭证号
  voucherDate: '', //	String	凭证日期
  currencyNumber: '1', //	String	币种编码
  currencyName: '人民币', //	String	币种名称
  referNumber: '', //	String	参考编码
  headerText: '', //	String	抬头文本
  voucherNumber: '', //	String	凭证编号
  postingDate: new Date() * 1, //	long	过账日期
  companyNumber: '', //	String	公司编码
  companyName: '', //	String	公司名称
  postingPeriod: '', //	String	过账期间
  postingYear: '', //	String	会计年度
  totalDebitAmount: '', //	bigDecimal	借方金额总金额
  totalCreditAmount: '', // bigDecimal	贷方金额总金额
  attachQuantity: '', //	bigDecimal	附件数量
  preparedByNumber: '', //	String	制单人编号
  preparedByName: '', //	String	制单人名称
  reviewerNumber: '', //	String	审核人编号
  reviewerName: '', //	String	审核人名称
  postingPersonNumber: '', //	String	过账人编号
  postingPersonName: '', //	String	过账人名称
  createdBy: '', //	String	创建人编码
  createdNameBy: '', //	String	创建人名称
  updatedBy: '', //	String	修改人编码
  updatedNameBy: '', //	String	修改人名称
  createdTime: '', //	String	创建日期
  updatedTime: '', //	String	修改日期
  lineList: [],
  files: [],
});
const columns = reactive([
  {
    prop: 'summary',
    label: '摘要',
    width: '300',
  },
  {
    prop: 'subjectCode',
    label: '科目编码',
    width: '300',
  },
  {
    prop: 'subjectName',
    label: '科目名称',
    width: '300',
  },
  {
    prop: 'dimensionSplice',
    label: '核算维度',
    minWidth: '300',
  },
  {
    prop: 'debitAmount',
    label: '借方金额',
    width: '200',
  },
  {
    prop: 'creditAmount',
    label: '贷方金额',
    width: '200',
  },
  {
    prop: 'agValue',
    label: '分配',
    width: '200',
  },
]);
// 公司
const companyList = ref([]);
const getCompanyList = async () => {
  const { data } = await companyInfo({});
  companyList.value = data;
};
getCompanyList();
// 凭证类型
const voucherTypeList = ref([]);
const getVoucherTypeList = async () => {
  const { data } = await findVoucherTypeList({});
  voucherTypeList.value = data;
};
getVoucherTypeList();
//获取详情
const getDetail = (id) => {
  findFinanceVoucherById({ headerId: id }).then((res) => {
    assignFormData(formData.value, res.data);
    lineList.value = res.data.lineList.map((it) => {
      return {
        ...it,
        dimensionSplice: it.lineADDTOList
          ? it.lineADDTOList
              .map((it) => it.dimensionName)
              .filter(Boolean)
              .join()
          : '',
      };
    });
  });
};
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      getDetail(props.params.id);
    }
  },
  { deep: true, immediate: true },
);

const close = () => {
  emit('update:modelValue', false);
};
</script>
