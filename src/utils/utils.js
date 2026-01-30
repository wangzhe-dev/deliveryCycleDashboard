import { ElMessage } from 'element-plus';
import _ from 'lodash';
/**
 * 通用js方法封装处理
 * Copyright (c) 2019 jne
 */
/**
 * @param obj any
 * @description 判断数据类型万能
 * @returns {string} ：Number, Null, Function, Array, Proxy-****
 */
export const getType = (obj) => {
  return Object.prototype.toString.call(obj).slice(8, -1);
};

// 日期格式化
export function parseTime(time, pattern) {
  if (arguments.length === 0 || !time) {
    return null;
  }
  const format = pattern || '{y}-{m}-{d} {h}:{i}:{s}';
  let date;
  if (typeof time === 'object') {
    date = time;
  } else {
    if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
      time = parseInt(time);
    } else if (typeof time === 'string') {
      time = time
        .replace(new RegExp(/-/gm), '/')
        .replace('T', ' ')
        .replace(new RegExp(/\.[\d]{3}/gm), '');
    }
    if (typeof time === 'number' && time.toString().length === 10) {
      time = time * 1000;
    }
    date = new Date(time);
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay(),
  };
  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key];
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') {
      return ['日', '一', '二', '三', '四', '五', '六'][value];
    }
    if (result.length > 0 && value < 10) {
      value = '0' + value;
    }
    return value || 0;
  });
  return time_str;
}

// 表单重置
export function resetForm(refName) {
  if (this.$refs[refName]) {
    this.$refs[refName].resetFields();
  }
}

// 添加日期范围
export function addDateRange(params, dateRange, propName) {
  let search = params;
  search.params =
    typeof search.params === 'object' && search.params !== null && !Array.isArray(search.params)
      ? search.params
      : {};
  dateRange = Array.isArray(dateRange) ? dateRange : [];
  if (typeof propName === 'undefined') {
    search.params['beginTime'] = dateRange[0];
    search.params['endTime'] = dateRange[1];
  } else {
    search.params['begin' + propName] = dateRange[0];
    search.params['end' + propName] = dateRange[1];
  }
  return search;
}

// 回显数据字典
export function selectDictLabel(datas, value) {
  if (value === undefined || !value) {
    return '';
  }
  var actions = [];
  Object.keys(datas).some((key) => {
    if (datas[key].value == '' + value) {
      actions.push(datas[key].label);
      return true;
    }
  });
  if (actions.length === 0) {
    actions.push(value);
  }
  return actions.join('');
}

// 回显数据字典（字符串数组）
export function selectDictLabels(datas, value, separator) {
  if (value === undefined || value.length === 0 || !value) {
    return '';
  }
  if (Array.isArray(value)) {
    value = value.join(',');
  }
  var actions = [];
  var currentSeparator = undefined === separator ? ',' : separator;
  var temp = value.split(currentSeparator);
  Object.keys(value.split(currentSeparator)).some((val) => {
    var match = false;
    console.log(Object.keys(datas), 'datas');
    Object.keys(datas).some((key) => {
      if (datas[key].value == '' + temp[val]) {
        actions.push(datas[key].label + currentSeparator);
        match = true;
      }
    });
    if (!match) {
      actions.push(temp[val] + currentSeparator);
    }
  });
  return actions.join('').substring(0, actions.join('').length - 1);
}

// 字符串格式化(%s )
export function sprintf(str) {
  var args = arguments,
    flag = true,
    i = 1;
  str = str.replace(/%s/g, function () {
    var arg = args[i++];
    if (typeof arg === 'undefined') {
      flag = false;
      return '';
    }
    return arg;
  });
  return flag ? str : '';
}

// 转换字符串，undefined,null等转化为""
export function parseStrEmpty(str) {
  if (!str || str == 'undefined' || str == 'null') {
    return '';
  }
  return str;
}

// 数据合并
export function mergeRecursive(source, target) {
  for (var p in target) {
    try {
      if (target[p].constructor == Object) {
        source[p] = mergeRecursive(source[p], target[p]);
      } else {
        source[p] = target[p];
      }
    } catch (e) {
      source[p] = target[p];
    }
  }
  return source;
}

/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 */
export function handleTree(data, id, parentId, children) {
  let config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children',
  };

  var childrenListMap = {};
  var nodeIds = {};
  var tree = [];

  for (let d of data) {
    let parentId = d[config.parentId];
    if (childrenListMap[parentId] == null) {
      childrenListMap[parentId] = [];
    }
    nodeIds[d[config.id]] = d;
    childrenListMap[parentId].push(d);
  }

  for (let d of data) {
    let parentId = d[config.parentId];
    if (nodeIds[parentId] == null) {
      tree.push(d);
    }
  }

  for (let t of tree) {
    adaptToChildrenList(t);
  }

  function adaptToChildrenList(o) {
    if (childrenListMap[o[config.id]] !== null) {
      o[config.childrenList] = childrenListMap[o[config.id]];
    }
    if (o[config.childrenList]) {
      for (let c of o[config.childrenList]) {
        adaptToChildrenList(c);
      }
    }
  }
  return tree;
}

/**
 * 参数处理
 * @param {*} params  参数
 */
export function tansParams(params) {
  let result = '';
  for (const propName of Object.keys(params)) {
    const value = params[propName];
    var part = encodeURIComponent(propName) + '=';
    if (value !== null && value !== '' && typeof value !== 'undefined') {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== '' && typeof value[key] !== 'undefined') {
            let params = propName + '[' + key + ']';
            var subPart = encodeURIComponent(params) + '=';
            result += subPart + encodeURIComponent(value[key]) + '&';
          }
        }
      } else {
        result += part + encodeURIComponent(value) + '&';
      }
    }
  }
  return result;
}

// 返回项目路径
export function getNormalPath(p) {
  if (p.length === 0 || !p || p == 'undefined') {
    return p;
  }
  let res = p.replace('//', '/');
  if (res[res.length - 1] === '/') {
    return res.slice(0, res.length - 1);
  }
  return res;
}

// 验证是否为blob格式
export function blobValidate(data) {
  return data.type !== 'application/json';
}

/**
 * @description 根据枚举列表查询当需要的数据（如果指定了 label 和 value 的 key值，会自动识别格式化）
 * @param {String} callValue 当前单元格值
 * @param {Array} enumData 字典列表
 * @param {Array} fieldNames label && value && children 的 key 值
 * @param {String} type 过滤类型（目前只有 tag）
 * @returns {String}
 * */
export function filterEnum(callValue, enumData, fieldNames, type, isReturn) {
  const value = fieldNames?.value ?? 'value';
  const label = fieldNames?.label ?? 'label';
  const children = fieldNames?.children ?? 'children';
  let filterData = {};
  if (getType(callValue) === 'Number') {
    callValue = callValue.toString();
  }
  if (!callValue) {
    return callValue;
  }
  if (callValue?.includes(',')) {
    callValue = callValue.split(',');
  }
  if (Array.isArray(callValue)) {
    let v = callValue.map((it) => {
      // 判断 enumData 是否为数组
      if (Array.isArray(enumData)) filterData = findItemNested(enumData, it, value, children);
      // 判断是否输出的结果为 tag 类型
      if (type == 'tag') {
        return filterData?.tagType ? filterData.tagType : '';
      } else {
        if (isReturn) {
          return filterData || null;
        }
        return filterData ? filterData[label] : '--';
      }
    });
    return v.join(',');
  }
  // 判断 enumData 是否为数组
  if (Array.isArray(enumData)) filterData = findItemNested(enumData, callValue, value, children);
  // 判断是否输出的结果为 tag 类型
  if (type == 'tag') {
    return filterData?.elTagType ? filterData.elTagType : '';
  } else {
    if (isReturn) {
      return filterData || null;
    }
    return filterData ? filterData[label] : '--';
  }
}

/**
 * @description 处理值无数据情况
 * @param {*} callValue 需要处理的值
 * @returns {String}
 * */
export function formatValue(callValue) {
  // 如果当前值为数组，使用 / 拼接（根据需求自定义）
  if (Array.isArray(callValue)) return callValue.length ? callValue.join(' / ') : '-';
  return callValue ?? '-';
}

/**
 * @description 处理 prop，当 prop 为多级嵌套时 ==> 返回最后一级 prop
 * @param {String} prop 当前 prop
 * @returns {String}
 * */
export function handleProp(prop) {
  const propArr = prop.split('.');
  if (propArr.length == 1) return prop;
  return propArr[propArr.length - 1];
}

/**
 * @description 处理 prop 为多级嵌套的情况，返回的数据 (列如: prop: user.name)
 * @param {Object} row 当前行数据
 * @param {String} prop 当前 prop
 * @returns {*}
 * */
export function handleRowAccordingToProp(row, prop) {
  if (!prop.includes('.')) return isTemp(row[prop]) ?? '-';
  prop.split('.').forEach((item) => (row = row[item] ?? '-'));
  return row;
}

/**
 * 判断是否为空数据
 * @param {*} value
 * @returns
 */
function isTemp(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return value;
}
/*
 * label, children 都需要更改用此方法
 * arr, label, children
 */
export function formatTree(arr, label, children) {
  arr &&
    Array.isArray(arr) &&
    arr.length &&
    arr.map((item) => {
      item.children = item[children];
      item.label = item[label];
      if (item[children] && item[children].length) {
        formatTree(item.children, label, children);
      }
    });
  return arr;
}

export const showWarn = (message, cb = () => {}, duration = 3000, offset = 20, grouping = true) => {
  ElMessage({
    type: 'warning',
    message,
    duration,
    offset,
    grouping,
    onClose: cb || (() => {}),
  });
};

export const showError = (
  message,
  cb = () => {},
  duration = 3000,
  offset = 20,
  grouping = true,
) => {
  ElMessage({
    type: 'error',
    message,
    duration,
    offset,
    grouping,
    onClose: cb || (() => {}),
  });
};
export const showInfo = (message, cb = () => {}, duration = 3000, offset = 20, grouping = true) => {
  ElMessage({
    type: 'info',
    message,
    duration,
    offset,
    grouping,
    onClose: cb || (() => {}),
  });
};

export const showSuccess = (
  message,
  cb = () => {},
  duration = 3000,
  offset = 20,
  grouping = true,
) => {
  ElMessage({
    type: 'success',
    message,
    duration,
    offset,
    grouping,
    onClose: cb || (() => {}),
  });
};

/**
 * 响应提示弹窗
 */
export const responseMsg = ({ code, msg = '', data = {} }) => {
  let success = code === 200;
  const msgMethod = success ? showSuccess : showError;
  return new Promise((resolve, reject) => {
    msgMethod(msg);
    success ? resolve(data) : reject(data);
  });
};
/**
 * @description 递归查找 callValue 对应的 enum 值
 * */
export function findItemNested(enumData, callValue, value, children) {
  return enumData.reduce((accumulator, current) => {
    if (accumulator) return accumulator;
    if (current[value] == callValue) return current;
    if (current[children]) return findItemNested(current[children], callValue, value, children);
  }, null);
}

/** 数组根据数组对象中的某个属性值进行排序的方法
 * 使用例子：newArray.sort(sortByCode('number',false)) //表示根据number属性降序排列;若第二个参数不传递，默认表示升序排序
 * @param attr 排序的属性 如number属性
 * @param rev true表示升序排列，false降序排序
 * */
export function sortByCode(attr, rev) {
  // 第二个参数没有传递 默认升序排列
  if (rev == undefined) {
    rev = 1;
  } else {
    rev = rev ? 1 : -1;
  }

  return function (a, b) {
    a = a[attr];
    b = b[attr];
    if (a < b) {
      return rev * -1;
    }
    if (a > b) {
      return rev * 1;
    }
    return 0;
  };
}

/**
 * @description: 根据Value查找Label
 * @return {*} 所在对象
 */
export const mapValueToLabel = (value, list, codeField = 'value', labelField = 'label') => {
  if (!list.length) {
    list = list.value;
  }
  // 检查数据是否是一个数组
  if (!Array.isArray(list) || !list.length) {
    return value;
  }
  // 查找代码对应的对象
  const obj = list.find((item) => item[codeField]?.toString() === value?.toString());
  // 检查代码是否存在于数据中
  if (!obj) {
    return value;
  }
  // 返回代码对应的名称
  return obj[labelField];
};

/**
 * 表单赋值
 */
export const assignFormData = (formData, originData) => {
  if (formData && originData) {
    Object.keys(formData).forEach((k) => {
      if (![undefined, null].includes(originData[k])) {
        formData[k] = _.cloneDeep(originData[k]);
      }
    });
  }
};
/**
 * @description: 生成uuid
 * @return {*}
 */
export const getUuid = () => {
  if (typeof crypto === 'object') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === 'function' && typeof Uint8Array === 'function') {
      const callback = (c) => {
        const num = Number(c);
        return (num ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))).toString(
          16,
        );
      };
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, callback);
    }
  }
  let timestamp = new Date().getTime();
  let perforNow =
    (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let random = Math.random() * 16;
    if (timestamp > 0) {
      random = (timestamp + random) % 16 | 0;
      timestamp = Math.floor(timestamp / 16);
    } else {
      random = (perforNow + random) % 16 | 0;
      perforNow = Math.floor(perforNow / 16);
    }
    return (c === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
};

// 扁平化树状结构--部门树
export const flattenJSON = (jsonData, parentName = '', fullCode = '', result = []) => {
  jsonData.forEach((item) => {
    const fullParentName = (parentName ? parentName + '/' : '') + item.fullName;
    const fullParentCode = (fullCode ? fullCode + '/' : '') + item.costCenterCode;
    item.fullParentName = fullParentName;
    item.fullParentCode = fullParentCode;
    result.push(item);
    if (item.children && item.children.length > 0) {
      flattenJSON(item.children, fullParentName, fullParentCode, result);
    }
  });
  return result;
};

/**
 * 获取url 对象序列化
 * @param string
 */
export const httpBuilderUrl = (url, data) => {
  if (typeof url === 'undefined' || url === null) {
    return '';
  }
  url += url.indexOf('?') != -1 ? '' : '?';
  for (let k in data) {
    if (typeof data[k] === 'undefined' || data[k] === null || typeof data !== 'object') {
      data[k] = '';
    }
    url += (url.indexOf('=') != -1 ? '&' : '') + k + '=' + encodeURIComponent(data[k]);
  }
  return url;
};

export const wsProtocol = () => {
  return (
    window.location.protocol.replace('https:', 'wss:').replace('http:', 'ws:') +
    '//' +
    window.location.hostname
  );
};

/**
 * @description: Echarts Zoom End百分比
 * @param {*} len: 长度：根据数组长度算dataZoom的end
 * @param {*} num: 可视区域显示几个
 * @return {*} end：百分比
 */
export const dataZoomEndScaleByDataLen = (len, num = 20) => {
  // 显示比例
  let scale = num / len;
  let result = (scale * 100).toFixed(0);
  return result >= 100 ? 100 : result;
};

/**
 * @description: Echarts Zoom Start百分比
 * @param {*} len: 长度：根据数组长度算dataZoom的start
 * @param {*} num: 可视区域显示几个
 * @return {*} result：百分比
 */
export const dataZoomEndScaleByDataStart = (len, num = 20) => {
  if (num > len) {
    return 0;
  }
  // 显示比例
  let scale = num / len;
  // end的值
  let start = (scale * 100).toFixed(2);
  let result = 100 - start;
  return result < 0 ? 99 : result;
};

/**
 * 生成uuid 生成唯一编码
 * @return string 生成的code
 */
export function generateUniqueCode() {
  const CODE_LENGTH = 10;
  let code = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  // return一个类似 "1D7C2929B1" 的十位唯一编码
  return code.toUpperCase();
}

/**
 * @description: js判断颜色是不是rgba是的话把最后的a改为0.3
 * @param {*} color String rgba颜色
 * @param {*} opacity Number 透明度
 * @return {*} 返回浅色的颜色
 */
export const darkToLight = (color, opacity = 0.16) => {
  if (/^rgba/.test(color)) {
    // 使用正则表达式判断颜色是否为rgba
    return color.replace(/rgba\((.*?)\)/, function (match, p1) {
      // 使用字符串方法替换最后的a值
      return 'rgba(' + p1.split(',').slice(0, 3).join(',') + ',' + opacity + ')';
    });
  } else {
    // 判断color中有#号，如果有#号，就把color转换为rgb
    if (/^#([0-9a-fA-F]{3}){1,2}$/.test(color)) {
      const r = parseInt(color.substring(1, 3), 16);
      const g = parseInt(color.substring(3, 5), 16);
      const b = parseInt(color.substring(5, 7), 16);
      return `rgb(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }
};

// 延时执行
export function delayer(fn, fnParam, ms = 500) {
  let timer = setTimeout(() => {
    fn && fn(fnParam);

    clearTimeout(timer);
    timer = null;
  }, ms);
}

export function base64_encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
