const koa = require('koa'); // 引入koa框架
const app = new koa(); // 实例化koa
const koaJson = require('koa-json'); // 返回给前端的数据是json对象
const koaBodyparser = require('koa-bodyparser'); // post提交的对象
const router = require('koa-router')(); // 路由 实例化new路由
const koa2Cors = require('koa2-cors'); // 解决前端不需要跨域
const abnormal = require('./config/abnormal'); // 引入自定义接口异常处理结果

// 注册
app.use(koa2Cors())
app.use(koaJson())
app.use(koaBodyparser())
app.use(abnormal)

// 引入注册 api
const login = require('./router/login/login');
// 引入上传文件 api
const upload = require('./router/upload/upload');
// 引入订单 api
const order = require('./router/order/order');
// 引入生成小程序二维码
const produceCode = require('./router/code/code');

// 配置注册路由接口
router.use('/api', login)  // 用户注册：localhost:8000/api/register
router.use('/api', upload)
router.use('/api', order)
router.use('/api', produceCode)

// 启动路由
app.use(router.routes())
app.use(router.allowedMethods())

// 自定义启动端口号 浏览器访问localhost:6000
app.listen(8000)
console.log('koa-node扫码点餐服务启动');