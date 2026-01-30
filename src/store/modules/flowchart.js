import request from '@/utils/request';

const useFlowchartStore = defineStore('flowchart', {
  state: () => ({
    title: '凭证流',
    type: '',
    api: '',
    visible: false,
    params: {},
    tableData: [],
    columns: [
      {
        prop: 'voucherName',
        label: '', // TODO: 参考单号来源自定义
        render: ({ row }) => `${row.voucherName}: ${row.voucherNo}`,
      },
      {
        prop: 'referNo',
        label: '关联单号',
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
          // data: ['1cda690b-239a-4b8b-8065-35786e7f5ef5'],
        });
        if (code === 200) {
          this.tableData = data || [];
        }
      } catch (e) {
        console.log(e, 'getTableData');
        this.tableData = [];
      }
    },
  },
});

export default useFlowchartStore;
