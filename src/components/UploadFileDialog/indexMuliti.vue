<template>
  <el-dialog :title="title" v-model="visible" width="500px" append-to-body @close="close">
    <el-input v-if="projectNum" v-model="projectNumber" placeholder="请输入项目号"></el-input>
    <el-upload
      ref="uploadRef"
      :limit="upload.limit"
      :multiple="true"
      :accept="upload.accept.join()"
      :headers="upload.headers"
      :disabled="upload.isUploading"
      :on-exceed="handleExceed"
      :auto-upload="false"
      :file-list="fileList"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
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
          <span v-if="upload.limit > 1">最多可上传{{ upload.limit }}个文件。</span>
          <el-link
            type="primary"
            :hover="false"
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
        <el-button
          type="primary"
          @click="submitFileForm"
          :loading="upload.isUploading"
          :disabled="fileList.length === 0"
        >
          {{ upload.isUploading ? '上传中...' : '开始上传' }}
        </el-button>
        <el-button @click="cancel" :disabled="upload.isUploading">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { getToken, getSToken } from '@/utils/auth';
import { assignFormData } from '@/utils/utils';
import { ElNotification, ElMessage } from 'element-plus';
import { UploadFilled, Document, Close } from '@element-plus/icons-vue';
import router from '@/router';
import axios from 'axios';
const { proxy } = getCurrentInstance();

const props = defineProps({
  title: {
    type: String,
    default: '上传',
  },
  projectNum: {
    type: Number,
    required: true,
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
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'success', 'importSuccess']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const title = ref(props.title);
const projectNum = ref(props.projectNum);
const uploadRef = ref(null);
const projectNumber = ref(null);
const fileList = ref([]);

// 上传配置
const upload = reactive({
  accept: ['.xlsx', '.xls'],
  isUploading: false,
  headers: {
    Authorization: 'Bearer ' + getToken(),
    'Content-Type': 'multipart/form-data',
  },
  url: import.meta.env.VITE_APP_BASE_API + '/file/batchUploadV2',
  limit: 30,
  downloadTemplate: {
    // url: 'erpMaster/master/nesting/temp',
    // name: `套料BOM导入模版_${new Date().getTime()}.xlsx`,
    // params: {},
  },
  query: {},
});

const useStoken = +import.meta.env.VITE_APP_USE_STOKEN;
if (!useStoken) {
  upload.headers['Ut'] = '00';
} else {
  upload.headers['Stoken'] = sTokenObj.sToken;
}
onMounted(() => {
  nextTick(() => {
    projectNumber.value = '';
    fileList.value = [];
  });
});
watch(
  () => props.options,
  (val) => {
    assignFormData(upload, val);
  },
  { immediate: true, deep: true },
);

// 文件大小格式化
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 文件变化处理
const handleFileChange = (file, files) => {
  fileList.value = files;
};

// 文件移除处理
const handleFileRemove = (file, files) => {
  fileList.value = files;
};

// 手动移除文件
const handleRemove = (file) => {
  uploadRef.value.handleRemove(file);
}; // 文件超出数量限制
const handleExceed = () => {
  proxy.$message.warning('最多只能上传30张图片');
};
// 下载模板
const importTemplate = () => {
  proxy.download(
    upload.downloadTemplate.url,
    upload.downloadTemplate?.params ?? {},
    upload.downloadTemplate.name,
    upload.downloadTemplate?.config ?? {},
  );
};

// 提交文件上传
const submitFileForm = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }

  upload.isUploading = true;

  try {
    const formData = new FormData();

    // 添加查询参数
    if (upload.query) {
      Object.keys(upload.query).forEach((key) => {
        formData.append(key, upload.query[key]);
      });
    }

    // 添加所有文件
    fileList.value.forEach((file) => {
      formData.append('file', file.raw);
    });

    // 更新文件状态为上传中
    fileList.value = fileList.value.map((file) => ({
      ...file,
      status: 'uploading',
      percentage: 0,
    }));

    // 使用axios发送请求
    const response = await axios({
      url: upload.url,
      method: 'post',
      data: formData,
      headers: upload.headers,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // 更新所有文件的上传进度
        fileList.value = fileList.value.map((file) => ({
          ...file,
          percentage: percentCompleted,
        }));
      },
    });

    // 处理上传成功
    handleUploadSuccess(response.data);
  } catch (error) {
    upload.isUploading = false;
    proxy.showWarning('上传失败: ' + (error.message || '未知错误'));
    console.error('上传错误:', error);
    fileList.value = []; // 强制清空文件列表
  }
};

// 处理上传成功
const handleUploadSuccess = async (response) => {
  upload.isUploading = false;
  const { code, data, msg } = response;
  if (code !== 200) {
    proxy.showWarning(msg || '上传失败');
    return;
  } else {
    if (projectNum.value) {
      const projectNum = ref({ projectNumber: projectNumber.value, requestList: data });
      if (projectNumber.value) {
        emit('success', projectNum.value);
        fileList.value = [];
      } else {
        proxy.showWarning('请选择项目');
      }
    } else {
      emit('success', data);
      fileList.value = [];
    }
  }
};
// 取消
const cancel = () => {
  uploadRef.value?.clearFiles();
  fileList.value = [];
  upload.isUploading = false;
  visible.value = false;
};

// 关闭
const close = () => {
  // cancel();
};
</script>

<style scoped>
.file-list {
  margin-top: 15px;
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.file-name {
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

.delete-icon {
  cursor: pointer;
  color: #f56c6c;
}

.delete-icon:hover {
  color: #f78989;
}

.el-progress {
  width: 100px;
  margin-right: 10px;
}
</style>
