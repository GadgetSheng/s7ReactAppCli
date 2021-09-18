var os = require('os');
var fs = require('fs');
var path = require('path');
var http = require('http');

function download(url: string, callback: Function) {
	var wrapCallback = function (err?: Error, data?: any) {
		callback && callback(err, data);
	};

	var req = http.get(url, function (res: any) {
		res.on('error', wrapCallback);
		var fileName = ((res.headers['content-disposition'] || '').match(/filename="(.+?)"/) || ['', ''])[1] || 'download.tmp';
		var tmpDir = path.resolve(os.tmpdir(), './tmp_' + (+ new Date()) + '_' + ('' + Math.random()).slice(2));
		var filePath = path.resolve(tmpDir, fileName);

		fs.mkdir(tmpDir, function (err: Error) {
			if (err) {
				wrapCallback(err);
				res.destroy();
			} else {
				var steam = fs.createWriteStream(filePath);
				res.pipe(steam);
				steam.on('close', function () {
					wrapCallback(undefined, filePath);
				});
			}
		});
	});

	req.on('error', wrapCallback);
}

module.exports = download;
export { }