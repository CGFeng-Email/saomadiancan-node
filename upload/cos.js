// cos: 标识代表腾讯云服务器

// 创建磁盘存储引擎
const multer = require('@koa/multer');

// 引入腾讯云插件
var COS = require('cos-nodejs-sdk-v5');
var cos = new COS({
    SecretId: 'AKIDkNrEaomqiS1Vq58yiLn1LVTDl8Pex7ED', // 子账号密钥id
 	SecretKey: 'sa6ORHtHSQF792iBRhkpnY6WoxxnT2Sl', // 子账号密钥key
    Protocol: 'https:'
});

const Bucket = 'diancan-1317202885'; // 存储桶名称
const Region = 'ap-guangzhou'; // 存储桶所在地区ip // ap-guangzhou

// 存储文件到本地
const storage = multer.diskStorage({
    // 定义存储文件存放的位置，目录
    destination: function (req, file, cb) {
        // 判断上传文件的类型 - 存放指定类型的文件目录
        if (file.mimetype == 'video/mp4') {
            // 存放视频
            cb(null, 'upload/video')
        } else if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/gif' || file.mimetype == 'image/png') {
            // 存放图片
            cb(null, 'upload/img')
        } else if (file.mimetype == 'text/plain') {
            // 存放text文件
            cb(null, 'upload/text')
        } else if (file.mimetype == 'application/msword') {
            // 存放doc文档
            cb(null, 'upload/doc')
        }
    },
    // 定义存储文件时存储的名字
    filename: function (req, file, cb) {
        // console.log('file', file);
        // 防止文件重名 + 拼接后缀
        // 切割成数组字符串 去最后的后缀
        const filtArray = file.originalname.split('.');
        // console.log('filtArray', filtArray);
        // Date.now() 返回自1970年1月1日到现在的毫秒数
        const name = `${Date.now()+'-'+Math.floor(Math.random(0,1) * 10000)}.${filtArray[filtArray.length -1]}`
        // console.log('name', name);
        cb(null, name)
    }
})

// 存储文件到腾讯云服务器
// fileName: 传递进来的上传文件名称
// filePath: 传递进来的上传文件路径
// cosPath: 根据文件类型存放指定的文件目录

const cosFun = function (fileName, filePath, cosPath) {
    return new Promise((resolve, reject) => {
        cos.uploadFile({
            Bucket, // 存储桶名称
            Region, // 存储桶所在地区ip
            Key: cosPath + fileName,
            /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
            FilePath: filePath, // 上传文件路径
        }).then(res => {
            // console.log('上传cos', res);
            // 返回已经存储到腾讯云服务器的图片链接
            // res.Location: 是已经存储到腾讯云服务器存储桶里面的文件链接
            resolve(res.Location)
        }).catch(err => {
            // console.log('上传cos失败', err);
            reject(err)
        })
    })
}

// 注册
const upload = multer({
    storage
})

// 导出
module.exports = {
    upload,
    cosFun,
}