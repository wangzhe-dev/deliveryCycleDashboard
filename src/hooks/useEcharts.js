/*
 * @Author: zhaijinsong
 * @Date: 2023-10-10 16:17:21
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-05-15 18:23:39
 * @Description: 传入dom元素返回echarts实例
 */
import * as echarts from 'echarts';
import { EleResize } from '@/utils/echartsResize';
/**
 * @description 数据操作
 * @param {HTMLElement} el
 * */
export default function (el) {
  // 初始化echarts实例
  const echartsInstance = echarts.init(el);

  // 设置选项
  const setOptions = (options = {}) => {
    echartsInstance.setOption(options);
  };

  // echarts重新渲染
  const updateSize = () => {
    echartsInstance.resize();
  };

  // 浏览器窗口变化重新渲染，宽度设为非固定值可达到响应式效果
  // window.addEventListener('resize', () => {
  //   echartsInstance.resize();
  // });

  EleResize.on(el, updateSize);

  return {
    echartsInstance,
    setOptions,
    updateSize,
  };
}
