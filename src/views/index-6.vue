<template>
  <div class="app-container home" ref="home">
    <!-- <el-row :gutter="20">
      <el-col :sm="24" :lg="12" style="padding-left: 20px">
        <h2>鲸航科技后台管理框架</h2>
        <p>
          致力于企业高效的ERP+MES系统
        </p>
      </el-col>

      <el-col :sm="24" :lg="12" style="padding-left: 50px">
        <el-row>
          <el-col :span="12">
            <h2>技术选型</h2>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="6">
            <h4>后端技术</h4>
            <ul>
              <li>SpringBoot</li>
              <li>SpringCloud</li>
              <li>Nacos</li>
              <li>Sentinel</li>
              <li>Seata</li>
              <li>Minio</li>
              <li>...</li>
            </ul>
          </el-col>
          <el-col :span="6">
            <h4>前端技术</h4>
            <ul>
              <li>Vue</li>
              <li>Vuex</li>
              <li>Element-ui</li>
              <li>Axios</li>
              <li>Echarts</li>
              <li>Quill</li>
              <li>...</li>
            </ul>
          </el-col>
        </el-row>
      </el-col>
    </el-row> -->

    <div class="home-title">
      <h2>{{ title }}</h2>
    </div>
    <!-- <div class="home-menu-wrap">
      <ul class="home-menu-ul">
        <li v-for="(mItem, mIndex) in menuList" :key="mIndex" class="home-menu-li" @click="goTarget(mItem)">
          <div class="home-menu-li-icon-wrap">
            <svg-icon color="#FFF" class-name="home-common-icon" :icon-class="mItem.icon"  />
          </div>
          <div class="home-menu-li-content">
            <div>
              <h4>{{ mItem.title }}</h4>
              <p>{{ mItem.desc }}</p>
            </div>
            <el-icon><ArrowRightBold /></el-icon>
          </div>
        </li>
      </ul>

    </div> -->
    <div
      class="new-menu-wrap"
      :style="{
        height: gridConfig.height + 'px',
        'grid-template-columns': `repeat(auto-fill, ${gridConfig.width}px)`,
      }"
    >
      <div
        class="new-group"
        v-for="item in sidebarRouterLine[0]"
        :key="item.title"
        :style="`background-image: url(${VITE_APP_BASE}icons/svg/${item.icon}.svg); width: ${
          gridConfig.width
        }px; height: ${gridConfig.height - 20}px`"
      >
        <div class="title">{{ item.title }}</div>
        <div class="sub-list">
          <div
            class="li"
            v-for="subItem in item.children"
            :key="subItem.title"
            @click="goTarget(subItem)"
          >
            <svg-icon class="pointer-icon" icon-class="pointer-right" />
            <span class="pl5">{{ subItem.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="new-menu-wrap"
      :style="{
        height: gridConfig.height + 'px',
        'grid-template-columns': `repeat(auto-fill, ${gridConfig.width})px`,
      }"
    >
      <div
        class="new-group"
        v-for="item in sidebarRouterLine[1]"
        :key="item.title"
        :style="`background-image: url(${VITE_APP_BASE}icons/svg/${item.icon}.svg); width: ${
          gridConfig.width
        }px; height: ${gridConfig.height - 20}px`"
      >
        <div class="title">{{ item.title }}</div>
        <div class="sub-list">
          <div
            class="li"
            v-for="subItem in item.children"
            :key="subItem.title"
            @click="goTarget(subItem)"
          >
            <svg-icon class="pointer-icon" icon-class="pointer-right" />
            <span class="pl5">{{ subItem.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="new-menu-wrap"
      :style="{
        height: gridConfig.height + 'px',
        'grid-template-columns': `repeat(auto-fill, ${gridConfig.width})px`,
      }"
    >
      <div
        class="new-group"
        v-for="item in sidebarRouterLine[2]"
        :key="item.title"
        :style="`background-image: url(${VITE_APP_BASE}icons/svg/${item.icon}.svg); width: ${
          gridConfig.width
        }px; height: ${gridConfig.height - 20}px`"
      >
        <div class="title">{{ item.title }}</div>
        <div class="sub-list">
          <div
            class="li"
            v-for="subItem in item.children"
            :key="subItem.title"
            @click="goTarget(subItem)"
          >
            <svg-icon class="pointer-icon" icon-class="pointer-right" />
            <span class="pl5">{{ subItem.title }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="Index">
import { cloneDeep } from 'lodash';
const VITE_APP_BASE = ref(import.meta.env.VITE_APP_BASE || '/');
const router = useRouter();
const version = ref('3.6.3');
import { isExternal } from '@/utils/validate';
import usePermissionStore from '@/store/modules/permission';
import useUserStore from '@/store/modules/user';
const userStore = useUserStore();
const permissionStore = usePermissionStore();
const sidebarRouters = computed(() => formatRouters(permissionStore.sidebarRouters));
const sidebarRouterLine = computed(() => {
  const tempSidebarRouters = cloneDeep(sidebarRouters.value);
  const lineNum = Math.ceil(tempSidebarRouters.length / 3);

  nextTick(() => {
    matchGridConfig();
  });

  const lineRouter = [];
  while (tempSidebarRouters.length > lineNum) {
    lineRouter.push(tempSidebarRouters.splice(0, lineNum));
  }
  lineRouter.push(tempSidebarRouters);

  return lineRouter;
});

const home = ref();

const gridConfig = ref({ width: '0', height: '0' });

const title = computed(() => getTitle(userStore.roles));

function getTitle(roles) {
  if (roles.includes('emadmin')) {
    return '欢迎使用制造运营管理一体化平台';
  }
  if (roles.includes('erp')) {
    return '欢迎使用ERP平台';
  }
  if (roles.includes('mes')) {
    return '欢迎使用MES平台';
  }
  if (roles.includes('iot')) {
    return '欢迎使用物联网平台';
  }
  return '欢迎使用制造运营管理一体化平台';
}
function goTarget(r) {
  const { path: name } = r;
  if (isExternal(name)) {
    window.open(name, '_blank');
    return;
  }
  router.push({ name });
}
function formatRouters(routers) {
  if (!Array.isArray(routers)) {
    return [];
  }
  const routerArr = [];
  routers.forEach((item) => {
    if (item.meta && !item.hidden) {
      routerArr.push({
        title: item.meta?.title,
        icon: item.meta?.icon,
        children: formatChildren(item.children),
      });
    }
  });
  return routerArr;
}
function formatChildren(children) {
  if (!Array.isArray(children)) {
    return [];
  }
  const childrenArr = [];
  children.forEach((item) => {
    if (item.meta && !item.hidden) {
      if (item.viewType === 'component') {
        const path = isExternal(item.path) ? item.path : item.name;
        childrenArr.push({
          title: item?.meta?.title,
          path,
        });
      } else {
        childrenArr.push({
          title: item?.meta?.title,
          path: formatRouterPath(item.children),
        });
      }
    }
  });
  return childrenArr;
}
function formatRouterPath(children) {
  if (!Array.isArray(children)) {
    return '';
  }
  let pathName = '';
  children.some((item) => {
    if (!item.hidden) {
      if (item.viewType === 'component') {
        const path = isExternal(item.path) ? item.path : item.name;
        pathName = path;
      } else {
        formatRouterPath(item.children);
      }
    }
    return item.viewType === 'component' && !item.hidden;
  });
  return pathName;
}

function matchGridConfig() {
  if (!home.value) return;

  const useWidth = home.value.clientWidth - 40; // padding gap
  const useHeight = home.value.clientHeight - 40; // padding  title gap

  const lineNum = Math.ceil(sidebarRouters.value.length / 3); // 每行的个数
  console.log(lineNum, 'lineNum-------', sidebarRouters.value.length);
  let gridWidth = Math.floor(useWidth / lineNum);
  gridWidth = gridWidth < 180 ? 180 : gridWidth;
  const gridHeight = Math.floor(useHeight / 3);

  gridConfig.value.width = gridWidth;
  gridConfig.value.height = gridHeight;
}

onMounted(() => {
  // matchGridConfig();
});
</script>

<style lang="scss">
.home {
  height: 100%;
  overflow: hidden;
  /* padding: 20px; */
  display: flex;
  flex-direction: column;
  .home-common-icon {
    color: #fff !important;
    fill: none !important;
    font-size: 40px;
  }

  .home-title {
    flex-shrink: 0;
    & > h2 {
      margin: 0;
      padding-bottom: 6px;
      padding-top: 0px;
      color: #262626;
      font-family: Source Han Sans SC;
      font-weight: bold;
      font-size: 28px;
      line-height: 36px;
      letter-spacing: 0px;
    }
  }

  .home-menu-wrap {
    .home-menu-ul {
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;

      .home-menu-li {
        margin: 0;
        padding: 0;
        margin-bottom: 48px;
        margin-right: 12px;
        display: flex;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        box-shadow: 0px 5px 10px 0px #00000019;

        .home-menu-li-icon-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 88px;
          height: 88px;
          background: linear-gradient(149.07deg, #67cbf6 0%, #4072ee 100%);
          box-shadow: 0px 5px 20px 0px #568aff63;
        }

        .home-menu-li-content {
          padding-left: 36px;
          padding-right: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          width: 300px;
          height: 88px;
          // background: conic-gradient(from 47deg, #F1F2F3 13%, #EEEEEE 24%, #C2C2C2 37%, #C3C3C3 53%, #FFFFFF 63%, #C5C5C5 76%, #FCFCFC 100%);
          background: conic-gradient(
            from 3.66deg,
            #bcbcbc 13%,
            #eeeeee 24%,
            #c2c2c2 37%,
            #c3c3c3 53%,
            #ffffff 63%,
            #c5c5c5 76%,
            #ffffff 100%
          );
          box-shadow: 0px 4px 4px 0px #00000019;

          h4 {
            margin: 0;
            padding: 0;
            line-height: 28px;
            letter-spacing: 0px;
            text-align: left;
            // font-family: PingFang SC;
            font-weight: bold;
            font-size: 20px;
            color: #3f3f3f;
          }

          p {
            margin: 0;
            padding: 0;
            line-height: 22px;
            letter-spacing: 0px;
            text-align: left;
            color: #3a3f5e;
            // font-family: PingFang SC;
            font-size: 16px;
          }
        }
      }
    }
  }

  .new-menu-wrap {
    margin: 0;
    padding: 0;
    margin-bottom: 2px;

    &:last-child {
      margin-bottom: 0px;
    }
    // display: flex;
    // flex-wrap: wrap;
    // flex: 1;
    /* overflow-y: auto; */
    // display: grid;
    // grid-template-columns: repeat(auto-fill, auto); // 自动填充，每个盒子宽度200px
    // gap: 10px; /* 盒子之间的间距 */
    // justify-content: space-around; 盒子在水平方向上平均分布
    display: flex;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 3px;
      height: 5px;
      cursor: pointer;
    }

    &::-webkit-scrollbar-track {
      background-color: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #c0c0c0;
      border-radius: 3px;
    }
    .new-group {
      margin-right: 20px;
      flex-grow: 0;
      flex-shrink: 0;
      width: 180px;
      height: 200px;
      border: 1px solid #ccc;
      border-radius: 5px;
      box-sizing: border-box;
      box-shadow: 0px 4px 4px 0px #00000019;
      // background-image: url('../assets/icons/svg/h-xsmk.svg');
      background-position: right bottom;
      background-size: 60px 60px;
      background-repeat: no-repeat;
      transition: all 0.6s;
      overflow: hidden;
      // overflow-y: auto;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      &:hover {
        box-shadow: 0px 8px 8px 0px #00000019;
        border-color: #4072ee;
      }
      .title {
        height: 30px;
        line-height: 30px;
        font-weight: bolder;
        text-indent: 1em;
        font-size: 16px;
        color: #262626;
        background: linear-gradient(149.07deg, #67cbf6 0%, #4072ee 100%);
        flex-shrink: 0;
      }
      .sub-list {
        padding: 0 10px;
        flex: 1;
        overflow-y: auto;
        &::-webkit-scrollbar {
          width: 2px;
          height: 2px;
        }

        &::-webkit-scrollbar-track {
          background-color: #f1f1f1;
        }

        &::-webkit-scrollbar-thumb {
          background-color: #c0c0c0;
          border-radius: 1px;
        }
        .li {
          height: 26px;
          line-height: 26px;
          font-size: 14px;
          text-indent: 8px;
          color: #3f3f3f;
          border-bottom: 1px solid #ccc;
          &:hover {
            color: #4072ee;
            border-bottom: 1px solid #4072ee;

            .pointer-icon {
              fill: #4072ee;
            }
          }
          &:last-child {
            border-color: transparent;
            &:hover {
              border-color: transparent;
            }
          }
          .pointer-icon {
            fill: #000;
          }
        }
      }
    }
  }
}
// .home {
//   height: calc(100vh - 53px);
//   background: url('../assets/images/login-background.jpg') no-repeat;
//   blockquote {
//     padding: 10px 20px;
//     margin: 0 0 20px;
//     font-size: 17.5px;
//     border-left: 5px solid #eee;
//   }
//   hr {
//     margin-top: 20px;
//     margin-bottom: 20px;
//     border: 0;
//     border-top: 1px solid #eee;
//   }
//   .col-item {
//     margin-bottom: 20px;
//   }

//   ul {
//     padding: 0;
//     margin: 0;
//   }

//   font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
//   font-size: 13px;
//   color: #fff;
//   overflow-x: hidden;

//   ul {
//     list-style-type: none;
//   }

//   h4 {
//     margin-top: 0px;
//   }

//   h2 {
//     margin-top: 10px;
//     font-size: 26px;
//     font-weight: 100;
//   }

//   p {
//     margin-top: 10px;

//     b {
//       font-weight: 700;
//     }
//   }

//   .update-log {
//     ol {
//       display: block;
//       list-style-type: decimal;
//       margin-block-start: 1em;
//       margin-block-end: 1em;
//       margin-inline-start: 0;
//       margin-inline-end: 0;
//       padding-inline-start: 40px;
//     }
//   }
// }
</style>
