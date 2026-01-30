<template>
  <el-dialog :title="title" v-model="visible" width="400px" append-to-body @close="close">
    <el-upload
      ref="uploadRef"
      :limit="1"
      :accept="upload.accept.join()"
      :headers="upload.headers"
      :action="upload.url + '?' + tansParams(upload.query)"
      :disabled="upload.isUploading"
      :on-progress="handleFileUploadProgress"
      :on-success="handleFileSuccess"
      :auto-upload="false"
      drag
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或
        <em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip text-center">
          <div class="el-upload__tip">
            <template v-if="upload.tip">{{ upload.tip }}</template>
          </div>
          <span>仅允许导入{{ upload.accept.join('、') }}格式文件。</span>
          <el-link
            type="primary"
            :underline="false"
            style="font-size: 12px; vertical-align: baseline"
            @click="importTemplate"
            v-if="upload?.downloadTemplate?.url"
          >
            下载模板
          </el-link>
        </div>
      </template>
    </el-upload>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup name="UploadFileDialog">
import { getToken, getSToken } from '@/utils/auth';
import request from '@/utils/request';
import { assignFormData, tansParams } from '@/utils/utils';
import { watch } from 'vue';
import { ElNotification } from 'element-plus';
import router from '@/router';
const sTokenObj = getSToken();
const { proxy } = getCurrentInstance();
const emit = defineEmits();
/** options 配置
 *
 * {
 *  accept: Array 支持文件格式
 *  url: String 上传地址
 *  query: Object 查询参数
 *  downloadTemplate: 下载模板
 *      {
 *          name: String 模板名称 带后缀
 *          url: String 下载地址,
 *          params: Object 参数
 *       }
 *  tip: String 提示
 *  limit: Number 限制个数
 * }
 */
const props = defineProps({
  title: {
    type: String,
    default: '上传',
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    require: true,
    type: Boolean,
    default: false,
  },
  isNotify: {
    type: Boolean,
    default: true
  }
});

const visible = ref(false);
const title = ref('');
const upload = reactive({
  accept: ['.xlsx', '.xls'],
  // 是否禁用上传
  isUploading: false,
  // 设置上传的请求头部
  headers: { Authorization: 'Bearer ' + getToken() },
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + '/file/upload',
  downloadTemplate: {
    url: 'system/user/importTemplate',
    name: `user_template_${new Date().getTime()}.xlsx`,
    params: {},
  },
  query: {},
});
const useStoken = +import.meta.env.VITE_APP_USE_STOKEN;
if (!useStoken) {
  upload.headers['Ut'] = '00';
} else {
  upload.headers['Stoken'] = sTokenObj.sToken; // STOKEN
}

watch(
  () => props.options,
  (val) => {
    assignFormData(upload, val);
  },
  { immediate: true, deep: true },
);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    title.value = props.title;
  },
  { deep: true, immediate: true },
);

/** 下载模板操作 */
function importTemplate() {
  proxy.download(
    upload.downloadTemplate.url,
    upload.downloadTemplate?.params ?? {},
    upload.downloadTemplate.name,
    upload.downloadTemplate?.config ?? {},
  );
}
/**文件上传中处理 */
const handleFileUploadProgress = (event, file, fileList) => {
  upload.isUploading = true;
};
/** 文件上传成功处理 */
const handleFileSuccess = async (response, file, fileList) => {
  upload.open = false;
  upload.isUploading = false;

  try {
    const { code, data, msg } = response;
    const { importConfig = {} } = props.options || {};
    const { api: importApi, params: importParams = {}, method, headers } = importConfig;
    if (code !== 200) {
      proxy.showWarning(msg);
      return;
    }

    proxy.$refs['uploadRef'].handleRemove(file);
    emit('success', response);

    if (!importApi) return;

    try {
      const payload = {
        ...(importParams || {}),
        fileName: data.name,
        fileUrl: data.url,
      };
      let res;
      if (typeof importApi === 'function') {
        res = await importApi(payload);
      } else if (typeof importApi === 'string') {
        const requestConfig = {
          url: importApi,
          method: (method || 'post').toLowerCase(),
          headers: headers || {},
        };
        if (['get', 'delete'].includes(requestConfig.method)) {
          requestConfig.params = payload;
        } else {
          requestConfig.data = payload;
        }
        res = await request(requestConfig);
      } else {
        console.warn('importConfig.api must be function or string');
        return;
      }
      const { code: importCode, msg: importMsg, success } = res || {};
      if (importCode === 200 || importCode === 0 || success === true) {
        props.isNotify && ElNotification({
          title: '提示',
          type: 'success',
          dangerouslyUseHTMLString: true,
          //
          message: `<div style="width: 100%;display: flex;justify-content: space-between;"> <span>${
            importMsg || '数据导入中...'
          }</span> <span style="padding-left: 12px; color: #409EFF; cursor: pointer; width: 80px; flex-shrink: 0">前去查看</span> </div>`,
          onClick: () => {
            router.push('/system/downloadCenter');
          },
        });
        emit('importSuccess', res);
        cancel();
      }
    } catch (e) {
      console.log(e, 'import');
    }
  } catch (e) {
    console.log(e, 'upload');
  }
};
/** 提交上传文件 */
function submitFileForm() {
  proxy.$refs['uploadRef'].submit();
}

// 取消
function cancel() {
  proxy.$refs['uploadRef'].clearFiles();
  emit('update:modelValue', false);
}

// 关闭
function close() {
  cancel();
}
</script>
