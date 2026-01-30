import hasRole from './permission/hasRole';
import hasPermi from './permission/hasPermi';
import copyText from './common/copyText';
import tableMobile from './common/directives'; // ★ 新增

export default function directive(app) {
  app.directive('hasRole', hasRole);
  app.directive('hasPermi', hasPermi);
  app.directive('copyText', copyText);
  // 全局注册 v-table-mobile
  app.directive('table-mobile', tableMobile);
}
