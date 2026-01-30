/*
 * @Author: 胡洋杰
 * @Date: 2023-09-01 10:04:55
 * @LastEditors: 胡洋杰
 * @LastEditTime: 2023-09-07 12:36:52
 * @Description:
 */
import request from '@/utils/request';

const useUpdateRecordStore = defineStore('updateRecord', {
  state: () => ({
    title: '修改记录',
    type: '',
    api: '',
    visible: false,
    params: {},
    tableData: [],
    columns: [
      {
        prop: 'number',
        label: '参照单号', // TODO: 参考单号来源自定义
      },
      {
        prop: 'comment',
        label: '字段名称',
        color: true,
      },
      {
        prop: 'details',
        label: '详情',
        width: 200,
      },
      {
        prop: 'createdNameBy',
        label: '修改人',
      },
      {
        prop: 'createdTime',
        label: '修改日期',
      },
    ],
  }),
  actions: {
    update(data) {
      Object.keys(data).forEach((k) => {
        Reflect.has(this, k) && (this[k] = data[k]);
      });
    },
    async getTableData() {
      try {
        const { code, data } = await request({
          url: this.api,
          method: 'post',
          data: [this.params.no],
        });
        if (code === 200) {
          const [$1] = data || [];
          this.tableData = $1?.list ?? [];
        }
      } catch (e) {
        console.log(e, 'getTableData');
        this.tableData = [];
      }
    },
  },
});

export default useUpdateRecordStore;
