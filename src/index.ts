const fs = require('fs');
const path = require('path');
const tar = require('tar');
const mkdirp = require('mkdirp');
const download = require('./download');

const nodeStarter = {
    DEFAULT_PROJECT_NAME: 'node-application',
    DEFAULT_APPID: 'Check it from http://cdng/. For example:10003344)',
    DEFAULT_LOCAL_PORT: 8888,
    NODE_SOA_SERVER_ID: 'Check it from http://soa/. For example:wireless.soa.nodesoaservice.v1.nodesoaservice',
    SOA_SERVER_CODE: 'Check it from http://soa/. For example: 16160',
    SOA_SERVER_VD: 'Path format.For example: /nodejs'
};
const PREFIX = 'http://git.dev.sh.-----.com/fx-front-end/node-starter';
const MIDFIX = 'repository/archive.tar.gz';// gitlab下tar
const DOWNLOAD_PACKAGE_URL = `${PREFIX}/${MIDFIX}?ref=v2.0.0`;
const DOWNLOAD_PACKAGE_SOA_SERVER_URL = `${PREFIX}/${MIDFIX}?ref=v2.0.0-soaserver`;
function init(opts: any, callback: Function) {
    opts = opts || {};
    opts.projectName = opts.projectName || nodeStarter.DEFAULT_PROJECT_NAME;
    opts.localPort = opts.localPort || nodeStarter.DEFAULT_LOCAL_PORT;
    opts.path = opts.path || process.cwd();
    opts.serverVd = opts.serverVd || '/';
    const wrapCallback = function (err?: Error) {
        callback && callback(err);
    };
    const URL = opts.soaServerId ? DOWNLOAD_PACKAGE_SOA_SERVER_URL : DOWNLOAD_PACKAGE_URL;
    download(URL, function (err: Error, file: string) {
        if (err) {
            wrapCallback(err);
        } else {

            const pArr: Array<Promise<void>> = [];
            const parser = new tar.Parse({
                onentry: function (entry: any) {
                    if (/^node-starter-v2.0.0-(soaserver-)?\w+\//.test(entry.path)) {
                        const relativePath = entry.path.replace(/^node-starter-v2.0.0-(soaserver-)?\w+\//, '');
                        const absolutePath = path.resolve(opts.path, relativePath);
                        if (entry.type == 'Directory') {
                            mkdirp(absolutePath, function (err: Error) {
                                if (err) {
                                    parser.abort();
                                    wrapCallback(err);
                                } else {
                                    entry.resume();
                                }
                            });
                        } else if (entry.type == 'File') {
                            if (relativePath == 'package.json') {
                                pArr.push(new Promise<void>(function (resolve) {
                                    readJson(entry, function (error: Error, json: any) {
                                        if (error) {
                                            parser.abort();
                                            wrapCallback(new Error('Parse Package.json Failed'));
                                            resolve();
                                        } else if (json) {
                                            json.name = opts.projectName;
                                            json.AppID = opts.appId;
                                            if (!json.config) {
                                                json.config = {};
                                            }
                                            json.config.port = opts.localPort;
                                            fs.writeFile(absolutePath, JSON.stringify(json, null, '\t'), function (err: Error) {
                                                if (err) {
                                                    parser.abort();
                                                    wrapCallback(err);
                                                }
                                                resolve();
                                            });
                                        }
                                    });
                                }));
                            } else if (relativePath == 'app.config.js' && opts.soaServerId) {
                                pArr.push(new Promise<void>(function (resolve) {
                                    readText(entry, function (data: any) {
                                        if (data.includes('ServiceId_data')) {
                                            data = data.replace(/ServiceId_data/g, (opts.soaServerId).toString())
                                            data = data.replace(/ServiceCode_data/g, (opts.serverCode).toString())
                                        }
                                        fs.writeFile(absolutePath, data, function (err: Error) {
                                            if (err) {
                                                parser.abort();
                                                wrapCallback(err);
                                            }
                                            resolve();
                                        });
                                        resolve();
                                    })
                                }));
                            } else {
                                const stream = fs.createWriteStream(absolutePath);
                                entry.pipe(stream);
                            }
                        }
                    } else {
                        entry.resume();
                    }
                }
            });
            parser.on('end', function () {
                Promise.all(pArr).then(function () {
                    wrapCallback();
                });
            });
            fs.createReadStream(file).pipe(parser);
        }
    });
};

function readContent(entry: any, callback: Function) {
    const buff: Array<Uint8Array> = [];
    entry.on('end', function () {
        callback && callback(Buffer.concat(buff));
    });
    entry.on('data', function (chunk: Uint8Array) {
        buff.push(chunk);
    });
}

function readText(entry: any, callback: Function) {
    readContent(entry, function (buff: Uint8Array) {
        callback && callback(buff.toString());
    });
}

function readJson(entry: any, callback: Function) {
    readText(entry, function (text: string) {
        var ret = null;
        try {
            ret = JSON.parse(text);
        } catch (e) {
            // empty
        }
        callback && callback(ret);
    });
}

module.exports = nodeStarter;
