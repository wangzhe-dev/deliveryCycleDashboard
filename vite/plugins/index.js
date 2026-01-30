/*
 * @Author: zhaijs
 * @Date: 2023-07-28 11:21:43
 * @LastEditTime: 2023-08-20 11:31:38
 * @Description: 请填写简介
 */
import vue from '@vitejs/plugin-vue'

import createAutoImport from './auto-import'
import createSvgIcon from './svg-icon'
import createCompression from './compression'
import createSetupExtend from './setup-extend'
import vueJsx from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'
export default function createVitePlugins(viteEnv, isBuild = false) {
    const vitePlugins = [vue(), vueJsx()]
    vitePlugins.push(createAutoImport())
	vitePlugins.push(createSetupExtend())
    vitePlugins.push(createSvgIcon(isBuild))
    vitePlugins.push(UnoCSS())
	isBuild && vitePlugins.push(...createCompression(viteEnv))
    return vitePlugins
}
