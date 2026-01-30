import { constantRoutes } from '@/router';

const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: constantRoutes,
    addRoutes: [],
    defaultRoutes: constantRoutes,
    topbarRouters: constantRoutes,
    sidebarRouters: constantRoutes,
  }),
  actions: {
    setRoutes(routes) {
      this.addRoutes = routes;
      this.routes = routes;
    },
    setDefaultRoutes(routes) {
      this.defaultRoutes = routes;
    },
    setTopbarRoutes(routes) {
      this.topbarRouters = routes;
    },
    setSidebarRouters(routes) {
      this.sidebarRouters = routes;
    },
    generateRoutes() {
      return new Promise((resolve) => {
        const routes = constantRoutes;
        this.setRoutes(routes);
        this.setSidebarRouters(routes);
        this.setDefaultRoutes(routes);
        this.setTopbarRoutes(routes);
        resolve(routes);
      });
    },
  },
});

export default usePermissionStore;
