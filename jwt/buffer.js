 // 引入腾讯云插件
 var COS = require('cos-nodejs-sdk-v5');
 var cos = new COS({
 	SecretId: 'AKIDjXItIfuxbFqX7XpywjP2d7QYWFj3Bi4E', // 子账号密钥id
 	SecretKey: 'z851yqeLqDUn5DESYSFqMyY1LUPH2hqn', // 子账号密钥key
 	Protocol: 'https:'
 });


 // 处理返回的数据
 function bufferFn(keyName, bufferData) {
 	return new Promise((resolve, reject) => {
 		cos.putObject({
 			Bucket: 'diancan-1317202885',
 			/* 填入您自己的存储桶，必须字段 */
 			Region: 'ap-guangzhou',
 			/* 存储桶所在地域，例如 ap-beijing，必须字段 */
 			Key: 'diancan/code/' + keyName,
 			/* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
 			Body: Buffer.from(bufferData),
 			/* 必须: 二进制数据 */
 		}, function(err, data) {
			// console.log('999', err, data);
			resolve(data.Location)
		});
 	})
 }

 // 给二进制图片 随机命名
 function bufferImgName(num) {
 	return new Date().getTime() + num + '.jpg';
 }

 module.exports = {
	bufferFn,
 	bufferImgName
 }