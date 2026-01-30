<template>
  <div style="position: relative">
    <div class="top-header">
      <div class="top-header-container">
        <div class="top-header-left">
          <!-- 左侧企业标识 -->
          <img
            src="../assets/images/header-logo-jl.png"
            alt="招商局工业集团威海船舶"
            class="mr20"
          />
        </div>
        <div class="top-header-right flex items-center">
          <!-- 用户信息 -->
          <div class="grzx">
            <div class="mr10 user-avatar">
              <img :src="state.avatar" />
            </div>
            <span class="fs16">{{ state.user.nickName }}</span>
          </div>
          <div
            style="width: 1px; background: rgb(155, 155, 155); margin: 0 6px; height: 47px"
          ></div>
          <img src="../assets/images/header-logo.jpg" alt="金陵" style="height: 42px" />
        </div>
      </div>
    </div>

    <div class="ce-app">
      <!-- 黄色区域：作为背景装饰 -->
      <div class="yellow-area-top"></div>
      <div class="yellow-area-bottom"></div>
      <div class="bottom-bg"></div>
      <!-- 卡片容器 -->
      <div class="card-container">
        <div class="ce-app-title">您好，欢迎来到招商局工业集团威海船舶有限公司</div>
        <!-- MOM 系统 -->
        <div class="box">
          <div class="ce-app-item" style="background: #f8f5ff" @click="go('/')">
            <div class="ce-app-item-text">MOM平台</div>
            <div class="ce-ic">
              <img src="../assets/images/home/mom.png" style="width: 118px; height: 118px" />
            </div>
          </div>
          <!-- LES 系统 -->
          <!-- <div class="ce-app-item" style="background: #fff7e0" @click="go('les')">
            <div class="ce-app-item-text">RCS系统</div>
            <div class="ce-ic">
              <img src="../assets/images/home/les.png" style="width: 118px; height: 118px" />
            </div>
          </div> -->
          <!-- RCS 系统 -->
          <div class="ce-app-item" style="background: #fff7e0" @click="go('rcs')">
            <div class="ce-app-item-text">RCS系统</div>
            <div class="ce-ic">
              <img src="../assets/images/home/les.png" style="width: 118px; height: 118px" />
            </div>
          </div>
          <!-- 数字孪生，仅展示 -->
          <div class="ce-app-item" style="background: #deebff">
            <div class="ce-app-item-text">数字孪生</div>
            <div class="ce-ic">
              <img src="../assets/images/home/szls.png" style="width: 118px; height: 118px" />
            </div>
          </div>
          <!-- 数据融合 -->
          <div class="ce-app-item" style="background: #eaf6f2" @click="go('sjrh')">
            <div class="ce-app-item-text">数据融合</div>
            <div class="ce-ic">
              <img src="../assets/images/home/sjrh.png" style="width: 118px; height: 118px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="Center">
import { getUserProfile } from '@/api/system/user';
import defAva from '@/assets/images/profile.png';
import useUserStore from '@/store/modules/user';
import { getEDCSToken, getToken } from '@/utils/auth';
import { useRouter } from 'vue-router';

const state = reactive({
  user: {},
  roleGroup: {},
  postGroup: {},
  avatar: '',
});

// 获取用户信息
function getUser() {
  getUserProfile().then((response) => {
    const { data } = response;
    state.roleGroup = response.roleGroup;
    state.postGroup = response.postGroup;
    state.avatar = data.avatar ? `${import.meta.env.VITE_APP_MINIO_URL}${data.avatar}` : defAva;
    state.user = data;
  });
}

// 检查并登录
!getToken() && !getEDCSToken() && useUserStore().edcCheckLogin();
getUser();

const router = useRouter();

// 跳转逻辑
function go(path) {
  if (path === 'les') {
    const url = 'http://10.147.128.110/login?CAS=TRUE';
    const sToken = getToken() || '';
    window.open(`${url}&token=${encodeURIComponent(sToken)}`);
  } else if (path === 'rcs') {
    const rcsUrl = 'https://10.147.159.110/portal/guest';
    const rcsToken = getToken() || '';
    window.open(`${rcsUrl}?tk=${encodeURIComponent(rcsToken)}`);
    console.log('444', `${rcsUrl}?tk=${encodeURIComponent(rcsToken)}`);
    return;
  } else if (path === 'sjrh') {
    const baseUrl = 'http://10.147.158.17:8888/api/whcc_login';
    const token = getToken() || '';
    window.open(`${baseUrl}?token=${encodeURIComponent(token)}`);
  } else if (path === '/') {
    router.push({ path });
  }
}
</script>

<style lang="scss" scoped>
/* 顶部头部样式 */
.top-header {
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: url('../assets/images/main-header.png');
  background-repeat: no-repeat;
  background-size: 100% 80px;
  padding: 0 20px;

  .top-header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .top-header-left {
      display: flex;
      align-items: center;

      img {
        height: 40px;
        display: block;

        &:last-child {
          height: 45px;
        }
      }
    }

    .top-header-center {
      color: #262626;
      font-family: Source Han Sans SC;
      font-weight: bold;
      font-size: 32px;
      line-height: normal;
    }

    .top-header-left,
    .top-header-right {
      width: 320px;
    }

    .top-header-right {
      display: flex;
      justify-content: flex-end;

      .user-avatar {
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
    }
  }
}

/* 系统入口区域 */
.ce-app {
  position: relative; /* 允许子元素绝对定位 */
  height: calc(100vh - 65px);
  width: 100%;
  overflow: hidden;
  .ce-app-title {
    font-size: 36px;
    font-weight: 600;
    color: rgb(34, 36, 46);
    padding: 0 0 50px 0;
  }
  /* 卡片容器 */
  .card-container {
    width: 100%;
    margin: clamp(32px, 6vw, 120px) auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 clamp(16px, 4vw, 80px);
    box-sizing: border-box;
  }
  .box {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: clamp(16px, 3vw, 48px);
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: 0;
  }
  /* 单个系统卡片 */
  .ce-app-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    z-index: 2;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s ease;
    padding: clamp(24px, 5vw, 80px) clamp(20px, 4vw, 120px);
    &:hover {
      transform: translateY(-4px);
    }

    .ce-ic {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: clamp(20px, 5vw, 50px);
    }

    .ce-app-item-text {
      font-size: clamp(18px, 2.3vw, 24px);
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  /* 黄色背景区域 */
  .yellow-area-top {
    position: absolute;
    /* 根据页面结构调整位置和尺寸 */
    top: 0; // 使黄色条位于标题下方
    left: 0;
    width: 100%;
    height: 45px; // 黄色区域高度，可根据需求调整
    background: linear-gradient(90deg, #f7b102 0%, #fcdda2 100%);
  }
  /* 黄色背景区域 */
  .yellow-area-bottom {
    position: absolute;
    /* 根据页面结构调整位置和尺寸 */
    bottom: 0;
    left: 0;
    width: 100%;
    height: 45px; // 黄色区域高度，可根据需求调整
    background: linear-gradient(90deg, #e8f2ff 0%, #b6d6ff 100%);
  }
  .bottom-bg {
    position: absolute;
    bottom: 45px;
    left: 0;
    width: 100%;
    height: 500px;
    background-image: url('../assets/images/home/bg.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    z-index: 1;
  }
}

/* 用户信息区域样式 */
.grzx {
  height: 80px;
  line-height: 80px;
  display: flex;
  align-items: center;
}
</style>
