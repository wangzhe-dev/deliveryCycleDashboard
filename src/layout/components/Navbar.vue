<!--
 * @Author: zhaijs
 * @Date: 2023-07-28 11:21:43
 * @LastEditTime: 2025-06-19 09:43:16
 * @Description: 请填写简介
-->
<template>
  <div class="navbar">
    <!-- <hamburger
      id="hamburger-container"
      :is-active="appStore.sidebar.opened"
      class="hamburger-container"
      @toggleClick="toggleSideBar"
    /> -->
    <!-- <breadcrumb
      id="breadcrumb-container"
      class="breadcrumb-container"
      v-if="!settingsStore.topNav"
    /> -->

    <top-nav id="topmenu-container" class="topmenu-container" v-if="settingsStore.topNav" />

    <div class="right-menu">
      <template v-if="appStore.device !== 'mobile'">
        <!-- <el-dropdown class="clear-outline" ref="dropdown1" @command="currentSysChange">
          <span class="clear-outline">
            <svg-icon
              icon-class="ContainerOutlined"
              style="font-size: 24px; margin-right: 12px; top: 0px; color: #262626"
            />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="it in SysOptions" :key="it.label" :command="it.value">
                {{ it.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown> -->
        <!-- <el-select v-if="useSToken" v-model="currentSys" style="width: 100px" @change="currentSysChange">
          <el-option v-for="it in SysOptions" :key="it.label" :label="it.label" :value="it.value" />
        </el-select> -->
        <!-- <header-search id="header-search" class="right-menu-item" /> -->
        <div class="messageBox px-8px py-0 h='[100%]' lh-8px flex items-center" @click="openDrawer">
          <el-badge
            :value="messageBody.unreadQuantity"
            :max="99"
            class="item"
            :hidden="messageBody.unreadQuantity == 0"
          >
            <el-icon style="font-size: 24px; top: 0px">
              <Bell style="top: -15px" />
            </el-icon>
          </el-badge>
        </div>
        <!-- <el-tooltip content="源码地址" effect="dark" placement="bottom">
          <ruo-yi-git id="jne-git" class="right-menu-item hover-effect" />
        </el-tooltip>

        <el-tooltip content="文档地址" effect="dark" placement="bottom">
          <ruo-yi-doc id="jne-doc" class="right-menu-item hover-effect" />
        </el-tooltip> -->

        <screenfull id="screenfull" class="right-menu-item hover-effect" />

        <!-- <el-tooltip content="布局大小" effect="dark" placement="bottom">
          <size-select id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip> -->
      </template>

      <div class="avatar-container">
        <el-dropdown
          @command="handleCommand"
          class="right-menu-item hover-effect"
          trigger="click"
          @click.stop
        >
          <div class="avatar-wrapper">
            <div class="user-avatar">
              <img v-if="!!imgUrl" :src="imgUrl" />
            </div>
            <el-icon>
              <caret-bottom />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <router-link to="/user/profile">
                <el-dropdown-item>个人中心</el-dropdown-item>
              </router-link>
              <el-dropdown-item command="setLayout">
                <span>布局设置</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-drawer v-model="drawer" title="未读消息列表" direction="rtl" :size="600">
      <ul class="messageList">
        <template v-if="messageList.length > 0">
          <li v-for="(item, index) in messageList" :key="index">
            <div class="title fs16 font-600">
              <span>{{ item.themeName }}</span>
              <el-button link type="primary" @click="viewDetail(item)">查看详情</el-button>
            </div>
            <div>
              <div class="fs14 lh-30" style="color: rgba(0, 0, 0, 0.9)">{{ item.content }}</div>
              <div class="fs12" style="color: rgba(0, 0, 0, 0.6)">{{ item.createdTime }}</div>
            </div>
          </li>
        </template>
        <el-empty v-else description="暂无未读消息" />
      </ul>
      <template #footer>
        <el-button @click="drawer = false">关闭</el-button>
        <el-button type="primary" @click="goMessage">查看更多</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { messageNumber, messagePageList, messageRead } from '@/api/index.js';
import { onUnmounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import Breadcrumb from '@/components/Breadcrumb';
import TopNav from '@/components/TopNav';
import Hamburger from '@/components/Hamburger';
import Screenfull from '@/components/Screenfull';
import SizeSelect from '@/components/SizeSelect';
import HeaderSearch from '@/components/HeaderSearch';
import JneGit from '@/components/Jne/Git';
import JneDoc from '@/components/Jne/Doc';
import useAppStore from '@/store/modules/app';
import useUserStore from '@/store/modules/user';
import useSettingsStore from '@/store/modules/settings';
import { getSToken, getUseEDC, getToken } from '@/utils/auth';
const useSToken = ref(+import.meta.env.VITE_APP_USE_STOKEN);
import { EventSourcePolyfill } from 'event-source-polyfill';
const TEST_ENV = ['production', 'development'];
const env = import.meta.env.VITE_APP_ENV_SUB;
const SYS_URL = {
  ship_uat: [
    {
      label: '物流',
      value: 'wl',
      path: 'http://10.0.3.168:8097/shipyard/?token=',
    },

    {
      label: '总控',
      value: 'zk',
      path: 'http://10.0.0.178/login?token=',
    },
    {
      label: '应急指挥',
      value: 'yjzh',
      path: 'http://113.98.201.201:9020?token=',
    },
    {
      label: '建造计划',
      value: 'jzjh',
      path: 'http://58.34.38.19/loading/global?redirect=/cimccm&STOKEN=',
    },
    {
      label: '线体调整',
      value: 'xttz',
      path: 'http://58.48.7.26:24527/?token=',
    },
    // {
    //   label: '能采环采平台',
    //   value: 'nchc',
    //   path: 'http://10.0.0.212:30880/iam-admin/loginWithPassportToken?redirectUrl=http://10.0.0.212&token=',
    // },
  ],
  ship_pro: [
    {
      label: '物流',
      value: 'wl',
      path: 'http://10.0.0.105:8097/shipyard/?token=',
    },

    {
      label: '总控',
      value: 'zk',
      path: 'http://10.0.0.178/login?token=',
    },

    {
      label: '应急指挥',
      value: 'yjzh',
      path: 'http://10.0.0.210/?token=',
    },
    {
      label: '建造计划',
      value: 'jzjh',
      path: 'http://10.0.0.19/loading/global?redirect=/cimccm&token=',
    },
    {
      label: '能采环采平台',
      value: 'nchc',
      path: 'http://10.0.0.212:30880/iam-admin/loginWithPassportToken?redirectUrl=http://10.0.0.212&token=',
    },
    {
      label: '线体调整',
      value: 'xttz',
      path: 'http://10.0.0.14:3000/?token=',
    },
    {
      label: '智能堆场',
      value: 'zndc',
      path: 'http://10.0.0.15:3000/?token=',
    },
    {
      label: '运营平台BI',
      value: 'yyptbi',
      path: 'http://10.0.0.179/finance-admin/index.html?token=',
    },
  ],
};
const SysOptions = ref(SYS_URL[env] || []);
const currentSys = ref('mcm');
const { proxy } = getCurrentInstance();
const socket = ref(null);
// 心跳参数
const heartbeat = ref({
  timeout: 50000,
  timer: null,
});

const appStore = useAppStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const drawer = ref(false);
const message = ref('');
const messageBody = ref({ unreadQuantity: 0 });
const messageList = ref([]);
const router = useRouter();
const route = useRoute();
function toggleSideBar() {
  appStore.toggleSideBar();
}

const problemManageBasePath = '/exceptionManagement/problemManage/problemManage/index';
const problemExceptionTypeMap = {
  1: '设备异常',
  2: '调试异常',
  3: '生产异常',
  4: '到货异常',
  5: '环境异常',
};
const problemExceptionRouteMap = Object.keys(problemExceptionTypeMap).reduce((acc, key) => {
  const type = Number(key);
  acc[type] = {
    label: problemExceptionTypeMap[type],
    path: `${problemManageBasePath}/${type}`,
  };
  return acc;
}, {});
const sourceMap = new Map([
  [0, { label: '销售下单', path: '/auditModule/inquiryOrder' }],
  [1, { label: '库存预警', path: '/auditModule/messageTM' }],
  [2, { label: '销售交货预警', path: '/salesOrderMan/salesOrder/salesOrderList' }],
  [3, { label: '质检预约', path: '/auditModule/messageTM' }],
  [4, { label: '工具归还提醒', path: '/auditModule/messageTM' }],
  [5, { label: '回访提醒', path: '/auditModule/messageTM' }],
  [6, { label: '点检延期', path: '/equipmentMaintain/inspect/inspectMy' }],
  [7, { label: '保养延期', path: '/equipmentMaintain/equipmentMaintain/maintainDispatchMy' }],
  [8, { label: '维修派工', path: '/equipmentMaintain/repair/myRepairOrder' }],
  [9, { label: '异常处理', path: '/exceptionManagement/exceptionHandling' }],
  [10, { label: '异常管理', path: problemManageBasePath }],
]);

const buildProblemManageTarget = (messageId, fallbackPath) => {
  const normalized = messageId == null ? '' : String(messageId).trim();
  if (!normalized.includes('-')) {
    const query = {};
    if (normalized) query.id = normalized;
    return { path: fallbackPath, query };
  }
  const [rawId, exceptionTypeSegment] = normalized.split('-', 2);
  const exceptionType = Number(exceptionTypeSegment);
  const routeConfig = problemExceptionRouteMap[exceptionType];
  if (!routeConfig) {
    const query = {};
    if (normalized) query.id = normalized;
    return { path: fallbackPath, query };
  }
  const query = {};
  if (rawId) {
    query.id = rawId;
  }
  return { path: routeConfig.path, query };
};

const buildNavigationTarget = (row) => {
  const sourceConfig = sourceMap.get(row.source);
  if (!sourceConfig?.path) return null;
  if (row.source === 10) {
    return buildProblemManageTarget(row.messageId, sourceConfig.path);
  }
  const query = {};
  if (row.messageId != null) {
    query.id = row.messageId;
  }
  return { path: sourceConfig.path, query };
};

function viewDetail(row) {
  messageRead({ id: row.id }).then((res) => {
    const navigationTarget = buildNavigationTarget(row);
    if (!navigationTarget) return;
    router.push(navigationTarget);
    drawer.value = false;
  });
}
// 拼接图片路径
const imgUrl = computed(() =>
  userStore.isShowAvatar
    ? `${import.meta.env.VITE_APP_MINIO_URL}${userStore.avatar}`
    : userStore.avatar,
);

function handleCommand(command) {
  switch (command) {
    case 'setLayout':
      setLayout();
      break;
    case 'logout':
      console.log('logout');
      logout();
      break;
    default:
      break;
  }
}

function currentSysChange(v) {
  const { path } = SysOptions.value.find((it) => it.value === v);
  window.open(path + getSToken().sToken);
}
async function getMessage() {
  if (!userStore.userId) return;

  const res = await messagePageList({ userId: userStore.userId, beRead: 0 });
  const data = res?.data?.records || [];
  messageList.value = data;
  // messageBody.value.unreadQuantity = data.length || 0;
}
async function openDrawer() {
  drawer.value = true;
  await getMessage();
}

function goMessage() {
  router.push('/system/messageManagement');
  drawer.value = false;
}
function logout() {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      userStore
        .logOut()
        .then(() => {
          if (getUseEDC()) {
            location.href = `${import.meta.env.VITE_APP_PASSPORT_LOGIN_PAGE || '/'}?redirect=${
              route.path
            }`;
          } else {
            // 否则全部重定向到登录页
            router.push(`/login?redirect=${route.path}`);
          }
        })
        .catch((err) => {});
    })
    .catch((err) => {
      console.log(err, 'err---2');
    });
}

const emits = defineEmits(['setLayout']);
function setLayout() {
  emits('setLayout');
}

function initWebSocket() {
  // 创建 websocket 对象
  socket.value = new WebSocket(`${import.meta.env.VITE_APP_WEB_SOCKET}/ws/${userStore.userId}`);
  // 连接打开
  socket.value.onopen = () => {
    // console.log('连接成功');
    // 启动心跳
    heartbeat.value.timer = setInterval(() => {
      socket.value.send('ping');
    }, 3000);
  };
  // 收到消息
  socket.value.onmessage = (event) => {
    // console.log('onmessage', event)
    if (event.data !== '接收内容：ping') {
      // console.log('最新推送', event.data)
      messageBody.value = JSON.parse(event.data);
    }
    // 重置心跳定时器
    clearInterval(heartbeat.value.timer);
    heartbeat.value.timer = null;
    heartbeat.value.timer = setInterval(() => {
      socket.value.send('ping');
    }, 3000);
  };

  // 连接关闭
  socket.value.onclose = () => {
    // ...
    // console.log('连接关闭')
    clearInterval(heartbeat.value.timer);
    heartbeat.value.timer = null;
    socket.value.onopen = () => {
      // console.log('重新连接成功');
      // 启动心跳
      heartbeat.value.timer = setInterval(() => {
        socket.value.send('ping');
      }, 3000);
    };
    // 收到消息
    socket.value.onmessage = (event) => {
      if (event.data !== '接收内容：ping') {
        console.log('最新推送', event.data);
        messageBody.value = JSON.parse(event.data);
      }
      // 重置心跳定时器
      clearInterval(heartbeat.value.timer);
      heartbeat.value.timer = null;
      heartbeat.value.timer = setInterval(() => {
        socket.value.send('ping');
      }, 3000);
    };

    // 连接关闭
    socket.value.onclose = () => {
      // ...
      console.log('连接关闭');
      clearInterval(heartbeat.value.timer);
      heartbeat.value.timer = null;
      socket.value.onopen = () => {
        console.log('重新连接成功');
        // 启动心跳
        heartbeat.value.timer = setInterval(() => {
          socket.value.send('ping');
        }, 3000);
      };
    };
  };
}
onMounted(() => {
  // setInterval(getMessage, 5000);
});
// onUnmounted(() => {
//   // 关闭 websocket
//   socket.value.close();
// });

// initWebSocket();

// onUnmounted(() => {
//   // 关闭 websocket
//   socket.value.close();
// });

const eventSource = new EventSourcePolyfill(
  `${import.meta.env.VITE_APP_BASE_API}/infra/user/messageSSE/unread-count?userId=${
    userStore.userId
  }&userName=${userStore.name}`,
  {
    headers: {
      Authorization: getToken(),
    },
    // 添加重试时间设置
    // 允许跨域
    withCredentials: true,
  },
);

// 修改open事件处理
eventSource.addEventListener('open', function (e) {
  // console.log('SSE连接成功', e);
  messageBody.value.unreadQuantity = 0; // 重置消息数
});

// 增强error事件处理
eventSource.addEventListener('error', function (err) {
  console.error('SSE连接错误:', err);

  if (err.status === 401) {
    console.error('SSE认证失败');
    eventSource.close();
    // 可以在这里处理重新登录逻辑
  } else if (err.status === 403) {
    console.error('SSE没有权限');
    eventSource.close();
  } else {
    console.error('SSE其他错误');
    // 可以在这里添加重连逻辑
    setTimeout(() => {
      if (eventSource) {
        console.log('关闭SSE连接');
        eventSource.close();
      }
    }, 5000);
  }
});

// 在组件卸载时关闭连接
onUnmounted(() => {
  if (eventSource) {
    console.log('关闭SSE连接');
    eventSource.close();
  }
});

// 添加初始化SSE的函数
function initSSE() {
  // ... EventSource初始化代码 ...
}

// 添加特定事件类型的监听
eventSource.addEventListener('unread-count', function (e) {
  // console.log('收到未读消息数更新:', e);
  try {
    // const data = JSON.parse(e.data);
    messageBody.value.unreadQuantity = e?.data || 0;
  } catch (err) {
    console.error('解析未读消息数据失败:', err);
  }
});
</script>

<style lang="scss">
li {
  list-style: none;
}

.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  // background: #fff;
  // box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    // float: right;
    // height: 90%;
    // line-height: 50px;
    display: flex;
    align-items: center;
    // margin-top: 10px;

    .el-badge__content.is-fixed.is-dot {
      top: 8px !important;
    }

    &:focus {
      outline: none;
    }

    .right-menu-item {
      padding: 0 8px;
      // height: 100%;
      // line-height: 50px;
      display: flex;
      align-items: center;
      font-size: 18px;
      color: #5a5e66;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
    }

    .avatar-container {
      // margin-right: 10px;

      .avatar-wrapper {
        // margin-top: 5px;
        display: flex;
        align-items: center;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #fff;
          overflow: hidden;

          > img {
            height: 100%;
            width: 100%;
            display: block;
          }
        }

        i {
          cursor: pointer;
          // position: absolute;
          // right: -20px;
          // top: 25px;
          font-size: 18px;
        }
      }

      .el-badge__content.is-fixed {
        top: 5px;
      }
    }
  }

  .messageList {
    display: flex;
    flex-direction: column;
    padding: 0;
    margin: 0;

    & > li {
      width: 100%;
      // margin-bottom: 15px;
      // background: #f5f5f5;
      padding: 10px;
      // border-radius: 5px;
      border-bottom: 1px solid #e8e8e8;

      .title {
        display: flex;
        justify-content: space-between;
      }

      .footer {
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}
</style>
