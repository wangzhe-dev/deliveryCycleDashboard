/*
 * @Author: zhaijinsong
 * @Date: 2023-11-17 14:56:13
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-04-09 10:45:40
 * @Description:
 */
export const statusColorList = [
  {
    id: 'a8640daff38a4dde829a286c840eea6b',
    accordingToOrder: 1,
    statusCode: 3,
    statusName: '报警',
    statusPriority: 3,
    displayColor: 'rgba(218,56,61,1)',
    systemKeep: 0,
    label: '报警',
    value: 3,
    lightColor: 'rgba(218,56,61,0.16)',
    linearColor: 'linear-gradient(92.53deg, rgba(218,56,61,0.89) 0%, rgba(218,56,61,0.6) 100%)',
    linearColor2:
      'linear-gradient(83.61deg, rgba(218,56,61,0.42) -4.03%, rgba(218,56,61,0) 89.25%)',
    type: 'danger',
  },
  {
    id: '5d2db00d620c4f6aa466b66a241fc08e',
    accordingToOrder: 2,
    statusCode: 1,
    statusName: '运行',
    statusPriority: 1,
    displayColor: 'rgba(109,187,0,1)',
    systemKeep: 0,
    label: '运行',
    value: 1,
    lightColor: 'rgba(109,187,0,0.16)',
    linearColor: 'linear-gradient(92.53deg, rgba(109,187,0,0.89) 0%, rgba(109,187,0,0.6) 100%)',
    linearColor2:
      'linear-gradient(83.61deg, rgba(109,187,0,0.42) -4.03%, rgba(109,187,0,0) 89.25%)',
    type: 'success',
  },
  {
    id: 'fddf6f70a00847d894a458f926472962',
    accordingToOrder: 3,
    statusCode: 2,
    statusName: '待机',
    statusPriority: 2,
    displayColor: 'rgba(250,173,20,1)',
    systemKeep: 0,
    label: '待机',
    value: 2,
    lightColor: 'rgba(250,173,20,0.16)',
    linearColor: 'linear-gradient(92.53deg, rgba(250,173,20,0.89) 0%, rgba(250,173,20,0.6) 100%)',
    linearColor2:
      'linear-gradient(83.61deg, rgba(250,173,20,0.42) -4.03%, rgba(250,173,20,0) 89.25%)',
    type: 'warning',
  },
  {
    id: '69ac1f2839cb4d20b41ae5ad86bad8a8',
    accordingToOrder: 4,
    statusCode: 4,
    statusName: '停机',
    statusPriority: 4,
    displayColor: 'rgba(182,182,182,1)',
    systemKeep: 0,
    label: '停机',
    value: 4,
    lightColor: 'rgba(182,182,182,0.16)',
    linearColor: 'linear-gradient(92.53deg, rgba(182,182,182,0.89) 0%, rgba(182,182,182,0.6) 100%)',
    linearColor2:
      'linear-gradient(83.61deg, rgba(182,182,182,0.42) -4.03%, rgba(182,182,182,0) 89.25%)',
    type: 'info',
  },
  {
    id: '69ac1f2839cb4d20b41ae5ad86bad8a7',
    accordingToOrder: 5,
    statusCode: 5,
    statusName: '急停',
    statusPriority: 4,
    displayColor: 'rgba(218,56,61,1)',
    systemKeep: 0,
    label: '急停',
    value: 5,
    lightColor: 'rgba(218,56,61,0.16)',
    linearColor: 'linear-gradient(92.53deg, rgba(218,56,61,0.89) 0%, rgba(182,182,182,0.6) 100%)',
    linearColor2:
      'linear-gradient(83.61deg, rgba(218,56,61,0.42) -4.03%, rgba(218,56,61,0) 89.25%)',
    type: 'info',
  },
];

// 异常节拍颜色 abnormalBeatColor
export const ABNORMAL_BEAT_COLOR = '#9E00FF';
// 节拍 -- 超过标准节拍
export const PROGRAM_BEAT = [
  {
    id: Symbol(),
    displayColor: ['#6300BF', ABNORMAL_BEAT_COLOR],
    statusName: '异常节拍',
    statusCode: '1',
  },
  { id: Symbol(), displayColor: ['#EBE100', '#5AACFF'], statusName: '节拍', statusCode: '0' },
];
