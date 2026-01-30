<template>
  <div class="app-container home">
    <!-- <div class="home-title">
      {{ title }}
    </div> -->
    <!-- <div class="new-menu-wrap">
      <div class="new-group" v-for="item in sidebarRouters" :key="item.title">
        <div class="title">
          <svg-icon
            v-if="item?.icon && item.icon !== '#'"
            class="menu-icon"
            :icon-class="item.icon.replace(/-蓝$/, '')"
          />
          <span class="ml8">{{ item.title }}</span>
        </div>
        <div class="sub-list">
          <div
            class="li"
            v-for="subItem in item.children"
            :key="subItem.title"
            @click="goTarget(subItem)"
          >
            <span class="pl5 text-ellipsis">{{ subItem.title }}</span>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup name="Index">
const VITE_APP_BASE = ref(import.meta.env.VITE_APP_BASE || '/');
const router = useRouter();
const version = ref('3.6.3');
import usePermissionStore from '@/store/modules/permission';
import useUserStore from '@/store/modules/user';
import { isExternal } from '@/utils/validate';
const userStore = useUserStore();
const permissionStore = usePermissionStore();
const sidebarRouters = computed(() => formatRouters(permissionStore.sidebarRouters));
console.log(sidebarRouters);

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
</script>

<style lang="scss" scoped>
.home {
  height: 100%;
  overflow: hidden;
  padding: 10px 20px 0 20px;
  display: flex;
  flex-direction: column;
  .home-common-icon {
    color: #fff !important;
    fill: none !important;
    font-size: 40px;
  }

  .home-title {
    font-weight: 500;
    font-size: 24px;
    color: #409eff;
    text-align: left;
    // font-style: normal;
    // text-transform: none;
    padding-bottom: 10px;
    margin: 0;
    // flex-shrink: 0;
    // & > h2 {
    //   margin: 0;
    //   padding-bottom: 30px;
    //   padding-top: 10px;
    //   color: #262626;
    //   font-family: Source Han Sans SC;
    //   font-weight: bold;
    //   font-size: 28px;
    //   line-height: 36px;
    //   letter-spacing: 0px;
    // }
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
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    // display: flex;
    // flex-wrap: wrap;
    // // display: grid;
    // // grid-template-columns: repeat(auto-fill, 250px); /* 自动填充，每个盒子宽度200px */
    // display: grid;
    // grid-template-columns: repeat(auto-fill, 230px);
    gap: 12px; /* 盒子之间的间距 */
    // justify-content: space-around;
    &::-webkit-scrollbar {
      width: 3px;
      height: 3px;
    }

    &::-webkit-scrollbar-track {
      background-color: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #c0c0c0;
      border-radius: 3px;
    }
    .new-group {
      // width: 230px; // 列宽下限
      // flex: 1 0 230px; // grow=1 shrink=0 basis=220px
      height: 260px;
      border: 1px solid #ccc;
      // border-radius: 5px;
      // box-sizing: border-box;
      // box-shadow: 0px 4px 4px 0px #00000019;
      // background: #ffffff;
      box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.06);
      border-radius: 8px 8px 8px 8px;
      border: 1px solid #e9ebee;
      // background-image: url('../assets/icons/svg/h-xsmk.svg');
      // background-position: 110px 130px;
      // background-size: 60px 60px;
      // background-repeat: no-repeat;
      // transition: all 0.6s;
      margin-bottom: 10px;
      overflow: hidden;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      // &:hover {
      //   box-shadow: 0px 8px 8px 0px #00000019;
      //   border-color: #4072ee;
      // }
      .title {
        // width: 230px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        height: 42px;
        font-family: '阿里巴巴普惠体 2.0 55 Regular';
        background: linear-gradient(90deg, #63c2f5 0%, #4379ee 100%);
        border-radius: 5px 5px 0px 0px;
        font-weight: 600;
        font-size: 16px;
        color: #ffffff;
        text-align: left;
        .menu-icon {
          margin-left: 5px;
          font-size: 24px;
        }
      }
      .sub-list {
        padding: 0 20px;
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
          background-color: #d6d6d6;
          border-radius: 1px;
        }
        .li {
          // height: 30px;
          // line-height: 30px;
          // font-size: 14px;
          text-indent: 8px;
          // color: #3f3f3f;
          border-bottom: 1px solid #e9ebee;
          display: flex;
          align-items: center;
          width: 100%; /* 或固定宽度，如 200px */
          overflow: hidden; /* 防止内容溢出 */
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
  .text-ellipsis {
    // font-weight: 400;
    font-size: 15px;
    margin: 8px 0;
    // color: rgba(102, 102, 102, 1);
    font-family: '阿里巴巴普惠体 2.0 55 Regular';
    // text-align: left;
    // font-style: normal;
    // text-transform: none;
    white-space: nowrap; /* 禁止换行 */
    overflow: hidden; /* 隐藏溢出内容 */
    text-overflow: ellipsis; /* 显示省略号 */
    flex: 1; /* 自动填充剩余空间 */
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
