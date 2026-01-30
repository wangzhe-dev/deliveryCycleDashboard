/*
 * @Author: heqi 17686373732@163.com
 * @Date: 2023-08-02 16:54:44
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-12-26 10:35:30
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import useDictStore from '@/store/modules/dict';
import { getDicts } from '@/api';
import { queryDictList } from '@/api';
import { getType } from '@/utils/utils';

/**
 * 获取字典数据
 */
export function useDict(...args) {
  const res = ref({});
  return (() => {
    args.forEach((dictType, index) => {
      res.value[dictType] = [];
      const dicts = useDictStore().getDict(dictType);
      if (dicts) {
        res.value[dictType] = dicts;
      } else {
        getDicts(dictType).then((resp) => {
          res.value[dictType] = resp.data.map((p) => ({
            label: p.dictLabel,
            value: getType(p.dictValue) === 'Number' ? p.dictValue.toString() : p.dictValue,
            elTagType: p.listClass,
            elTagClass: p.cssClass,
          }));
          useDictStore().setDict(dictType, res.value[dictType]);
        });
      }
    });
    return toRefs(res.value);
  })();
}

export function useDictList(dictType) {
  const res = ref({});
  return (() => {
    const waitDict = [];
    dictType.forEach((key) => {
      const dicts = useDictStore().getDict(key);
      if (dicts) {
        res.value[key] = dicts;
      } else {
        res.value[key] = [];
        waitDict.push(key);
      }
    });
    waitDict.length &&
      queryDictList(waitDict).then(({ code, data }) => {
        if (code === 200) {
          Object.keys(data).forEach((key) => {
            const item = data[key];
            const dicts = useDictStore().getDict(key);
            if (dicts) {
              res.value[key] = dicts;
            } else {
              res.value[key] = item.map((p) => ({
                label: p.dictLabel,
                value: getType(p.dictValue) === 'Number' ? p.dictValue.toString() : p.dictValue,
                elTagType: p.listClass,
                elTagClass: p.cssClass,
              }));
              useDictStore().setDict(key, res.value[key]);
            }
          });
        }
      });
    return toRefs(res.value);
  })();
}

export const useColumnsDict = async (dictType) => {
  const dicts = useDictStore().getDict(dictType);
  if (dicts) {
    return await { data: dicts };
  }
  const { code, data } = await getDicts(dictType);
  const dictList =
    code === 200
      ? data.map((p) => ({
          label: p.dictLabel,
          value: getType(p.dictValue) === 'Number' ? p.dictValue.toString() : p.dictValue,
          elTagType: p.listClass,
          elTagClass: p.cssClass,
        }))
      : [];
  dictList.length && useDictStore().setDict(dictType, dictList);
  return { data: dictList };
};
