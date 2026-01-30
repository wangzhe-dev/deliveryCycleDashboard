<template>
  <div style="width: 100%; height: 100%; overflow: hidden">
    <video ref="videoRef" :width="props.width" :height="props.height" muted="true">
      您的浏览器不支持H5播放器
    </video>
  </div>
</template>
<script setup lang="jsx" name="CameraVideo">
import '@/plugins/hls.js';
const hls = new Hls();

const videoRef = ref(null);

const props = defineProps({
  width: {
    default: 100,
  },
  height: {
    default: 100,
  },

  options: {
    default: () => ({}),
  },
});

function playVideo() {
  if (Hls.isSupported()) {
    // props.options.url ||
    const url = props.options.url || 'https://video.jnny-rhsy.com/openUrl/SnXzZII/live.m3u8';

    // if (!url) return;
    console.log(videoRef.value, 'videoRef.value');
    hls.attachMedia(videoRef.value);

    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      console.log('Video and HLS.js are now bound together !');
      hls.loadSource(url); // Add the path to your M3U8 file here
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        console.log('Manifest parsed, found ' + hls.levels.length + ' quality level');
        videoRef.value.play().catch((e) => console.error('Play failed:', e));
      });
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // 处理网络错误
              console.error('处理网络错误', data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // 处理媒体错误
              console.error('处理媒体错误', data);
              //   hls.recoverMediaError();
              break;
            case Hls.ErrorTypes.OTHER_ERROR:
              // 处理其他错误
              console.error('处理其他错误', data);
              break;
          }
        }
      });
    });
  } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
    // This will run in case the browser supports the HLS natively (like Safari)
    video.value.src = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'; // Add the path to your M3U8 file here
    video.value.addEventListener('loadedmetadata', function () {
      video.play().catch((e) => console.error('Play failed:', e));
    });
  }
}

watch(
  () => props.options.url,
  () => {
    nextTick(() => {
      playVideo();
    });
  },
);

nextTick(() => {
  playVideo();
});
</script>
