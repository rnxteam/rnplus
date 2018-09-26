/**
 * Created By wenxiang.hu on 2018/9/19
 */

const DEFAULT_RESOLVE = {
  ret: true,
  status: 0
};
const DEFAULT_REJECT = {
  ret: false,
  status: -1
};
class BeforeReceiveScheme {
  constructor() {
    this.taskList = [];
    this.foreverTaskList = [];
  }

  run = (json) =>{
    this.taskList = [].concat(this.foreverTaskList, this.taskList);
    return this._run(json);
  }

  _run = (json) => {
    if (this.taskList.length) {
      const runTimeFun = this.taskList.shift();
      const runTimeResult = runTimeFun(json);
      if (isPromise(runTimeResult)) {
        return runTimeResult.then((data) => {
          console.log('promise resolve data', data)
          return this._run(json);
        }, (data) => {
          console.log('promise reject data', data)
          this.resetTasks();
          return Promise.reject(DEFAULT_REJECT);
        })
      } else if (runTimeResult) {
        return this._run(json);
      } else {
        this.resetTasks();
        return Promise.reject(DEFAULT_REJECT);
      }
    } else {
      this.resetTasks();
      return Promise.resolve(DEFAULT_RESOLVE);
    }
  }

  addTask = (task) => {
    if (!isFun(task)) {
      throw new Error('onReceiveScheme task 仅支持Function');
    }

    this.taskList.push(task);
  }

  pushForeverTask = (task) => {
    if (!isFun(task)) {
      throw new Error('onReceiveScheme task 仅支持Function');
    }

    this.foreverTaskList.push(task);
  }

  popForeverTask = () => {
    this.foreverTaskList.pop();
  }

  resetTasks = () => {
    this.taskList = [];
  }
}

function isPromise(fun) {

  if (!fun) {
    return false;
  }

  if (typeof fun === 'object' && fun.then && typeof fun.then === 'function') {
    return true;
  }

  return false;
}

function isFun(fun) {

  if (!fun) {
    return false;
  }

  if (typeof fun === 'function') {
    return true;
  }

  return false;
}


/**
 * 分析路径，找出 projectId 和 scheme 类型 from handleScheme
 * @param {string} path
 */
function parsePath(path) {
  let projectId;
  let type;

  if (path.includes('/')) {
    const pathArr = path.split('/');
    projectId = pathArr[0];
    type = pathArr[1];
  } else {
    type = path;
  }

  return {
    projectId,
    type,
  };
}

/**
 * 初始数据格式化 from handleScheme
 * @param {string} viewOptsStr
 */
function tryToGetViewOpts(viewOptsStr = '') {
  if (!viewOptsStr) {
    return;
  }

  let res;
  const viewOptsDecoded = decodeURIComponent(viewOptsStr);

  try {
    res = JSON.parse(viewOptsDecoded);
  } catch (e) {
    console.warn(e);
  }
  return res;
}

const beforeReceiveScheme = new BeforeReceiveScheme();
RNPlus.defaults.beforeReceiveScheme = beforeReceiveScheme;
export default beforeReceiveScheme;


