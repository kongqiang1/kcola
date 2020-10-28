const path = require('path');
const Koa = require('koa');
const onerror = require('koa-onerror');
const lib = require('./lib');

const defaultConfig = {
  publicDir: '', // 访问静态资源目录
  routeDir: '', // 存放route文件目录
  ctrlDir: '', // 存放controller文件目录
  appConfigPath: '', // 框架配置文件地址
  middlewareOpts: {}, // 中间件配置参数
};

/**
 *
 *
 * @class Kcola
 * @extends {Koa}
 */
class Kcola extends Koa {
  /**
   *Creates an instance of Kcola.
   * @param {*} workDir 工程启动目录
   * @param {*} config
   * @memberof Kcolaß
   */
  constructor(workDir, config = {}) {
    global.__kcola_workdir = workDir;
    super();
    config = Object.assign(defaultConfig, config);
    this.use(require('koa-body')({multipart: true, parsedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']}), true);
    this.use(
        require('koa-static')(path.join(global.__kcola_workdir, config.publicDir || './public'), {defer: true}),
        true
    );
    onerror(this);
    lib(config, this); // koa-router会影响 koa-static中间件功能，故放到最后
    this.use(require('koa-json')(), true);
  }

  /**
   * 重写koa use方法
   * 保证中间件的顺序
   * @param {function} fn
   * @param {boolean} [defer=false]
   * @return {Kcola}
   * @memberof Kcola
   */
  use(fn, defer = false) {
    const copy = [].concat(this.middleware);
    if (defer) {
      super.use(fn);
    } else {
      this.middleware = [];
      super.use(fn);
      this.middleware = this.middleware.concat(copy);
    }
    return this;
  }

  /**
   *
   * 加载中间件
   * @param { Object } middleware
   * @memberof Kcola
   */
  loadMiddleware(middleware) {
    const middlewares = [];
    if (!Array.isArray(middleware)) {
      middlewares.push(middleware);
    }

    middlewares.forEach((m, i) => {
      if (typeof m.fn === 'function') {
        this.use(m.opts);
      }
    });
  }
}

module.exports = Kcola;
