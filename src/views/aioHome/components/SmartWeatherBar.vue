<script lang="jsx">
import { defineComponent, reactive, onMounted } from 'vue';
import axios from 'axios';

export default defineComponent({
  name: 'SmartWeatherBar',
  setup() {
    const env = reactive({
      pm25: '--',
      aqiLevel: '--',
      weatherText: '--',
      humidity: '--',
      temperature: '--',
      // 初始不展示图标，等接口返回后再根据天气代码动态计算
      weatherIcon: '',
    });

    const state = reactive({
      loading: false,
      error: null,
    });

    const mapWeatherCode = (code) => {
      if (code == null || !isFinite(code)) return '--';
      const c = Number(code);

      if (c === 0) return '晴';
      if (c === 1 || c === 2) return '多云';
      if (c === 3) return '阴';
      if (c === 45 || c === 48) return '雾';
      if (c >= 51 && c <= 57) return '毛毛雨';
      if (c >= 61 && c <= 67) return '雨';
      if (c >= 71 && c <= 77) return '雪';
      if (c >= 80 && c <= 82) return '阵雨';
      if (c >= 95) return '雷雨';
      return '多云';
    };

    // weathercode → 天气图标（这里用 Emoji 表示不同天气）
    const mapWeatherIcon = (code) => {
      if (code == null || !isFinite(code)) return '';
      const c = Number(code);

      if (c === 0) return '☀️'; // 晴
      if (c === 1 || c === 2) return '⛅'; // 多云
      if (c === 3) return '☁️'; // 阴
      if (c === 45 || c === 48) return '🌫️'; // 雾
      if (c >= 51 && c <= 57) return '🌦️'; // 毛毛雨
      if (c >= 61 && c <= 67) return '🌧️'; // 雨
      if (c >= 71 && c <= 77) return '🌨️'; // 雪
      if (c >= 80 && c <= 82) return '🌦️'; // 阵雨
      if (c >= 95) return '⛈️'; // 雷雨
      return '⛅';
    };

    // AQI 数值 → 等级文案（这里用常见区间，你也可以按国标微调）
    const mapAqiLevel = (aqi) => {
      if (aqi == null || !isFinite(aqi)) return '--';
      const v = Number(aqi);

      if (v <= 50) return '优';
      if (v <= 100) return '良';
      if (v <= 150) return '轻度污染';
      if (v <= 200) return '中度污染';
      if (v <= 300) return '重度污染';
      return '严重污染';
    };

    const fetchWeatherByCoords = async (lat, lon) => {
      try {
        // 天气 + 湿度
        const weatherPromise = axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: lat,
            longitude: lon,
            current_weather: true,
            // 要求返回湿度的小时数据
            hourly: 'relativehumidity_2m',
          },
        });

        // 空气质量（PM2.5 + AQI）
        const airPromise = axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
          params: {
            latitude: lat,
            longitude: lon,
            hourly: 'pm2_5,european_aqi',
          },
        });

        const [weatherRes, airRes] = await Promise.all([weatherPromise, airPromise]);

        const weatherData = weatherRes.data || {};
        const airData = airRes.data || {};

        const current = weatherData.current_weather || {};
        const hourly = weatherData.hourly || {};
        const humiditySeries = hourly.relativehumidity_2m || [];

        // 这里简单取第一个小时的湿度；你可以按时间精确匹配
        const humidity =
          humiditySeries.length && isFinite(humiditySeries[0])
            ? Math.round(humiditySeries[0])
            : '--';

        const airHourly = airData.hourly || {};
        const pmSeries = airHourly.pm2_5 || [];
        const aqiSeries = airHourly.european_aqi || [];

        const pm25 = pmSeries.length && isFinite(pmSeries[0]) ? Math.round(pmSeries[0]) : '--';
        const aqi = aqiSeries.length && isFinite(aqiSeries[0]) ? aqiSeries[0] : null;

        // 更新 UI
        env.pm25 = pm25;
        env.aqiLevel = mapAqiLevel(aqi);
        env.weatherText = mapWeatherCode(current.weathercode);
        env.humidity = humidity;
        env.temperature =
          current.temperature != null && isFinite(current.temperature)
            ? Math.round(current.temperature)
            : '--';

        // 根据当天的天气代码切换对应的天气图标
        env.weatherIcon = mapWeatherIcon(current.weathercode);
      } catch (e) {
        console.error('[SmartWeatherBar] 获取天气失败：', e);
        state.error = '天气数据获取失败';
      } finally {
        state.loading = false;
      }
    };

    const loadWeather = () => {
      state.loading = true;
      state.error = null;

      // 浏览器定位
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            fetchWeatherByCoords(lat, lon);
          },
          () => {
            // 定位失败走备用经纬度（你可以改成船厂坐标）
            const fallbackLat = 31.2;
            const fallbackLon = 121.5;
            fetchWeatherByCoords(fallbackLat, fallbackLon);
          },
          {
            timeout: 5000,
          },
        );
      } else {
        // 浏览器不支持定位，直接用备用经纬度
        const fallbackLat = 31.2;
        const fallbackLon = 121.5;
        fetchWeatherByCoords(fallbackLat, fallbackLon);
      }
    };

    onMounted(() => {
      loadWeather();
    });

    return () => (
      <div class="smart-weather-bar">
        {env.weatherIcon && <span class="smart-weather-bar__icon">{env.weatherIcon}</span>}
        <span class="smart-weather-bar__text">{env.weatherText}</span>
        {state.loading && <span class="weather-status">更新中...</span>}
        {!state.loading && state.error && (
          <span class="weather-status weather-status--error">{state.error}</span>
        )}
      </div>
    );
  },
});
</script>

<style scoped>
.smart-weather-bar {
  display: flex;
  align-items: center;
  gap: 6px;
}

.smart-weather-bar__icon {
  font-size: 30px;
}

.smart-weather-bar__text {
  font-size: 18px;
}

.weather-status {
  font-size: 12px;
  color: #aaa;
}

.weather-status--error {
  color: #ff6666;
}
</style>
