import { ElNotification } from 'element-plus';
import request from '@/utils/request';
import _ from 'lodash';
import router from '@/router';
const baseURL = import.meta.env.VITE_APP_MINIO_URL;

async function downloadV2(url, data = {}) {
  try {
    const { code, msg } = await request({ url, method: 'post', data });
    // TODO: 同步单个进度下载

    // 异步下载
    if (code === 200) {
      ElNotification({
        title: '提示',
        type: 'success',
        dangerouslyUseHTMLString: true,
        message: `<div style="width: 100%;display: flex;justify-content: space-between;"> <span>${ msg || '任务下载中...'}</span> <span style="padding-left: 12px; color: #409EFF; cursor: pointer; width: 80px; flex-shrink: 0">前去查看</span> </div>`,
        onClick: () => {
          router.push('/system/downloadCenter');
        },
      });
    }
  } catch (e) {
    console.log(e, 'e---downloadV2');
  }
}

export default _.throttle(downloadV2, 3000, {
  leading: true,
  trailing: false,
});
