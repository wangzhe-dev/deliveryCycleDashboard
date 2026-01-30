/*
 * @Author: zhaijs
 * @Date: 2023-07-28 11:21:43
 * @LastEditTime: 2024-09-05 11:14:41
 * @Description: 请填写简介
 */
import { createApp } from 'vue';

import Cookies from 'js-cookie';

import ElementPlus, { ElDialog } from 'element-plus';
import locale from 'element-plus/dist/locale/zh-cn.mjs'; // 中文语言

import 'virtual:uno.css';

import App from './App';
import store from './store';
import router from './router';
import directive from './directive'; // directive

// 注册指令
import plugins from './plugins'; // plugins
import { download } from '@/utils/request';

// svg图标
import 'virtual:svg-icons-register';
import SvgIcon from '@/components/SvgIcon';
import elementIcons from '@/components/SvgIcon/svgicon';
import './permission'; // permission control

import { useDict, useDictList, useColumnsDict } from '@/utils/dict';
import {
  parseTime,
  resetForm,
  addDateRange,
  handleTree,
  selectDictLabel,
  selectDictLabels,
  formatTree,
  responseMsg,
  showWarn,
  showError,
  showInfo,
  showSuccess,
} from '@/utils/utils';

import { printPage } from '@/utils/printConfig';

// 分页组件
import Pagination from '@/components/Pagination';
// 自定义表格工具组件
import RightToolbar from '@/components/RightToolbar';
// 富文本组件
import Editor from '@/components/Editor';
// 文件上传组件
import FileUpload from '@/components/FileUpload';
// 文件上传组件
import UploadFileDialog from '@/components/UploadFileDialog';
// 图片上传组件
import ImageUpload from '@/components/ImageUpload';
// 图片预览组件
import ImagePreview from '@/components/ImagePreview';
// 自定义树选择组件
import TreeSelect from '@/components/TreeSelect';
// 字典标签组件
import DictTag from '@/components/DictTag';
// table组件
import WsllTable from '@/components/WsllTable';
// form组件
import WsllForm from '@/components/WsllForm';
// select
import WsllSelect from '@/components/WsllForm/components/WsllSelect';
// input
import WsllInput from '@/components/WsllForm/components/WsllInput';
// date
import WsllDatePicker from '@/components/WsllForm/components/WsllDatePicker';
// image
import WsllImage from '@/components/WsllForm/components/WsllImage';

import VXETable from 'vxe-table';
import 'vxe-table/lib/style.css';

// 页面配置
VXETable.setConfig({
  zIndex: 999,
  loadingText: '加载中...',
  table: {
    showHeader: true,
    keepSource: true,
    // showOverflow: true,
    // showHeaderOverflow: true,
    // showFooterOverflow: true,
    autoResize: false,
    stripe: false,
    border: true,
    round: false,
    align: 'center',
    minHeight: 144,
    emptyText: '暂无数据',
  },
});
ElDialog.props.draggable = {
  default: true,
  type: Boolean,
};

const app = createApp(App);

// 使用element-plus 并且设置全局的大小
app.use(ElementPlus, {
  locale: locale,
  // 支持 large、default、small
  size: Cookies.get('size') || 'default',
});
import '@/assets/styles/index.scss'; // global css
// 全局方法挂载
app.config.globalProperties.useDict = useDict;
app.config.globalProperties.useDictList = useDictList;
app.config.globalProperties.useColumnsDict = useColumnsDict;
app.config.globalProperties.download = download;
app.config.globalProperties.parseTime = parseTime;
app.config.globalProperties.resetForm = resetForm;
app.config.globalProperties.handleTree = handleTree;
app.config.globalProperties.addDateRange = addDateRange;
app.config.globalProperties.selectDictLabel = selectDictLabel;
app.config.globalProperties.selectDictLabels = selectDictLabels;
app.config.globalProperties.formatTree = formatTree;
app.config.globalProperties.responseMsg = responseMsg;
app.config.globalProperties.showWarning = showWarn;
app.config.globalProperties.showError = showError;
app.config.globalProperties.showInfo = showInfo;
app.config.globalProperties.showSuccess = showSuccess;
app.config.globalProperties.$printPage = printPage;

// 全局组件挂载
app.component('DictTag', DictTag);
app.component('Pagination', Pagination);
app.component('TreeSelect', TreeSelect);
app.component('FileUpload', FileUpload);
app.component('UploadFileDialog', UploadFileDialog);
app.component('ImageUpload', ImageUpload);
app.component('ImagePreview', ImagePreview);
app.component('RightToolbar', RightToolbar);
app.component('Editor', Editor);
app.component('WsllTable', WsllTable);
app.component('WsllForm', WsllForm);
app.component('WsllSelect', WsllSelect);
app.component('WsllInput', WsllInput);
app.component('WsllDatePicker', WsllDatePicker);
app.component('WsllImage', WsllImage);
// app.component('ElDialog', ElDialog);
app.use(router);
app.use(store);
app.use(plugins);
app.use(elementIcons);
app.component('svg-icon', SvgIcon);
app.use(VXETable);
directive(app);

app.mount('#app');
