/*
 * @Author: zhaijinsong
 * @LastEditors: zhaijinsong
 */

import { defineConfig, presetUno } from 'unocss';
import presetRemToPx from '@unocss/preset-rem-to-px';
import transformerDirectives from '@unocss/transformer-directives';

export default defineConfig({
  rules: [
    [/^m(\d+)$/, ([, d]) => ({ margin: `${d}px` })],
    [/^mt(\d+)$/, (match) => ({ 'margin-top': `${match[1]}px` })],
    [/^mb(\d+)$/, (match) => ({ 'margin-bottom': `${match[1]}px` })],
    [/^ml(\d+)$/, (match) => ({ 'margin-left': `${match[1]}px` })],
    [/^mr(\d+)$/, (match) => ({ 'margin-right': `${match[1]}px` })],
    [/^p(\d+)$/, ([, d]) => ({ padding: `${d}px` })],
    [/^pt(\d+)$/, (match) => ({ 'padding-top': `${match[1]}px` })],
    [/^pb(\d+)$/, (match) => ({ 'padding-bottom': `${match[1]}px` })],
    [/^pl(\d+)$/, (match) => ({ 'padding-left': `${match[1]}px` })],
    [/^pr(\d+)$/, (match) => ({ 'padding-right': `${match[1]}px` })],
    [/^fs(\d+)$/, (match) => ({ 'font-size': `${match[1]}px` })],
    [/^zi(\d+)$/, (match) => ({ 'z-index': `${match[1]}` })],
    [/^w(\d+)p$/, (match) => ({ width: `${match[1]}%` })],
    [/^w(\d+)$/, (match) => ({ width: `${match[1]}px` })],
    [/^h(\d+)$/, (match) => ({ height: `${match[1]}px` })],
  ],
  presets: [
    presetUno(),
    presetRemToPx({
      baseFontSize: 4,
    }),
  ],
  transformers: [transformerDirectives()],
});
