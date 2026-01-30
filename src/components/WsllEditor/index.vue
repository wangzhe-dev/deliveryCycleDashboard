<!--
 * @Author: zhaijs
 * @Date: 2023-08-10 16:05:50
 * @LastEditTime: 2025-03-27 13:55:15
 * @Description: 富文本
-->
<template>
  <div style="border: 1px solid #ccc; width: 100%">
    <Toolbar
      style="border-bottom: 1px solid #ccc;"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
      v-if="!props.readOnly"
    />

    <Editor
      style="width: 100%; height: 500px; overflow-y: hidden"
      v-model="Val"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
      @onChange="updateHtml"
    />
  </div>
</template>
<script name="WsllEditor" setup>
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { getToken, getSToken } from '@/utils/auth';
import { ElMessage } from 'element-plus';
const sTokenObj = getSToken();
const emit = defineEmits(['update:modelValue', 'change']);
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: () => '',
  },
  change: {
    type: Function,
    default: () => () => {},
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});
const mode = ref('default');
const editorRef = shallowRef();
const toolbarConfig = {
  toolbarKeys: [
    'bold', // 加粗
    'italic', // 斜体
    'through', // 删除线
    'underline', // 下划线
    'bulletedList', // 无序列表
    'numberedList', // 有序列表
    'color', // 文字颜色
    'insertLink', // 插入链接
    'fontSize', // 字体大小
    'lineHeight', // 行高
    'uploadImage', // 上传图片
    'delIndent', // 缩进
    'indent', // 增进
    'deleteImage', //删除图片
    'divider', // 分割线
    'insertTable', // 插入表格
    'justifyCenter', // 居中对齐
    'justifyJustify', // 两端对齐
    'justifyLeft', // 左对齐
    'justifyRight', // 右对齐
    'undo', // 撤销
    'redo', // 重做
    'clearStyle', // 清除格式
    'fullScreen', // 全屏
  ],
  excludeKeys: [
    'bgColor', // 背景色
    'blockquote', // 引用
    'codeBlock', // 代码段
    'emotion', // 表情
    'fontFamily', // 字体
    'headerSelect', // 标题
  ],
};
const Val = ref(props.modelValue);
const editorConfig = {
  readOnly: props.readOnly,
  placeholder: '请输入内容',
  height: 500,
  MENU_CONF: {
    uploadImage: {
      server: import.meta.env.VITE_APP_BASE_API + '/file/knowledgeUpload',
      // 设置上传的请求头部
      headers: { Authorization: 'Bearer ' + getToken() },
      fieldName: 'file',
      // 限制文件大小
      maxFileSize: 100 * 1024 * 1024, // 5MB
      // 限制文件格式
      allowedFileTypes: ['image/*'],
      // 上传之前的回调函数
      onBeforeUpload(file) {
        // 验证文件大小
        if (file.size > 100 * 1024 * 1024) {
          ElMessage.error('文件大小不能超过 100MB');
          return false;
        }
        return true;
      },
      onSuccess(file, res) {
        console.log(` 上传成功`, res);
      },
      customInsert(res, insertFn) {
        insertFn(`${import.meta.env.VITE_APP_MINIO_URL}/${res.data[0].url}`, res.data[0].name);
      },
    },
  },
};
const useStoken = +import.meta.env.VITE_APP_USE_STOKEN;
if (!useStoken) {
  editorConfig['MENU_CONF'].uploadImage.headers['Ut'] = '00';
} else {
  editorConfig['MENU_CONF'].uploadImage.headers['Stoken'] = sTokenObj.sToken; // STOKEN
}
//监听父组件的值
watch(
  () => props.modelValue,
  () => {
    Val.value = props.modelValue;
  },
);

const updateHtml = (val) => {
  emit('change', Val.value);
};

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

const handleCreated = (editor) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
};

// 通过emit将值传递给父组件
emit('update:modelValue', Val);
</script>
