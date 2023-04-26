// 上传文件

// 路由
const router = require('koa-router')();

// 引入磁盘存储引擎文件
const {
    upload,
    cosFun
} = require('../../upload/cos');

const result = require('../../config/result');

// 上传接口
router.post('/upload', upload.single('file'), async (ctx) => {
    // console.log('ctx.file', ctx.file);
    // ctx.file：拿到上传上来的静态文件

    // 获取上传文件的类型
    const fileType = ctx.file.mimetype;
    let cosPath = '';
    // 根据不同类型 - 处理上传文件存放的目录
    if (fileType == 'video/mp4') {
        // 存放视频
        cosPath = 'diancan/video/';
    } else if (fileType == 'image/jpeg' || fileType == 'image/gif' || fileType == 'image/png') {
        // 存放图片
        cosPath = 'diancan/img/';
    } else if (fileType == 'text/plain') {
        // 存放text文件
        cosPath = 'diancan/text/';
    } else if (fileType == 'application/msword') {
        // 存放doc文档
        cosPath = 'diancan/doc/';
    } else {
        return new result(ctx, '不支持上传该类型的文件').answer();
    }

    // try catch可以捕获到conFun函数里面的reject函数要是有出错执行了就会直接走catch
    try {
        // 调用腾讯云存储桶函数
        const res = await cosFun(ctx.file.filename, ctx.file.path, cosPath);
        // console.log('res', res);
        new result(ctx, 'success', 200, 'https://' + res).answer();
    } catch (err) {
        new result(ctx, '上传失败').answer()
    }
})


// 导出
module.exports = router.routes()