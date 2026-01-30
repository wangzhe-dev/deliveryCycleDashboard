<template>
  <div class="top-header">
    <div class="top-header-container">
      <div class="top-header-left">
        <!-- <img src="../../assets/images/header-logo-jl.png" alt="招商局工业集团威海船舶" /> -->
      </div>
      <div class="top-header-center">{{ levelList[0].meta?.title ?? '首页' }}</div>
      <div class="top-header-right flex">
        <!-- <Navbar /> -->
        <!-- <div style="width: 1px; background: rgb(155, 155, 155); margin: 0 6px; height: 47px"></div> -->
        <!-- <img src="../../assets/images/header-logo.jpg" alt="鲸航科技" height="42" /> -->
      </div>
    </div>
  </div>
</template>
<script setup>
// 是否是船厂
const shipEnv = ['ship_pro', 'ship_uat'];
const isShipPro = shipEnv.includes(import.meta.env.VITE_APP_ENV_SUB);

const route = useRoute();
const router = useRouter();
const levelList = ref([]);

function getBreadcrumb() {
  // only show routes with meta.title
  let matched = route.matched.filter((item) => item.meta && item.meta.title);
  const first = matched[0];
  // 判断是否为首页
  if (!isDashboard(first)) {
    matched = [{ path: '/index', meta: { title: '首页' } }].concat(matched);
  }

  levelList.value = matched
    .filter((item) => item.meta && item.meta.title && item.meta.breadcrumb !== false)
    .slice(-1);
}
function isDashboard(route) {
  const name = route && route.name;
  if (!name) {
    return false;
  }
  return name.trim() === 'Index';
}
function handleLink(item) {
  const { redirect, path } = item;
  if (redirect) {
    router.push(redirect);
    return;
  }
  router.push(path);
}

watchEffect(() => {
  // if you go to the redirect page, do not update the breadcrumbs
  if (route.path.startsWith('/redirect/')) {
    return;
  }
  getBreadcrumb();
});
getBreadcrumb();
</script>
<style lang="scss">
.top-header {
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: url('../../assets/images/main-header.png');
  background-repeat: no-repeat;
  background-size: 100% 80px;
  padding: 0 20px;
  .top-header-container {
    display: flex;
    height: 65px;
    justify-content: space-between;
    align-items: center;
    .top-header-left {
      display: flex;
      align-items: center;
      img {
        // height: 40px;
        height: 70px !important;
        margin-left: -20px !important;
        display: block;
        &:last-child {
          height: 45px;
        }
      }
    }
    .top-header-center {
      color: #000;
      font-weight: 500;
      font-size: 24px;
      line-height: normal;
    }

    .top-header-left,
    .top-header-right {
      width: 320px;
    }
    .top-header-right {
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
