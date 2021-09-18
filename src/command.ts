#!/usr/bin/env node

var path = require('path');
var readline = require('readline');
var nodeStarter = require('./');


function doInit(type?: string) {
    var opts: { [key: string]: string } = {};
    opts.path = process.cwd();
    getOption(opts, 'projectName', 'Project Name', path.basename(process.cwd()))
        .then(() => getOption(opts, 'appId', 'AppID', nodeStarter.DEFAULT_APPID))
        .then(() => getOption(opts, 'localPort', 'Local Port', nodeStarter.DEFAULT_LOCAL_PORT))
        .then(() => {
            if (type === 'soaServer') {
                return getOption(opts, 'serverCode', 'soa Server Code', nodeStarter.SOA_SERVER_CODE)
                    .then(() => getOption(opts, 'serverVd', 'soa Server vd', nodeStarter.SOA_SERVER_VD))
                    .then(() => getOption(opts, 'soaServerId', 'soa Server Id', nodeStarter.NODE_SOA_SERVER_ID))
            }
            return;
        })
        .then(() => {
            rl.pause();
            return new Promise<void>(function (resolve, reject) {
                nodeStarter.init(opts, function (err: Error) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }).then(() => {
            console.log('Create New Project Success');
        }).catch((err: Error) => {
            console.log('Create New Project Failed:', err);
        });
}

function showHelp() {
    console.log('Basic Usage:');
    console.log('\tnodestarter init\tCreate New Empty Project');
    console.log('\tnodestarter init soaServer\tCreate New nodeSoaServer Project');
    console.log('\tnodestarter help\tShow Help');
}




function getOption(
    opts: { [key: string]: string }, key: string, desc: string, defaultValue: any
): Promise<void> {
    return new Promise<void>(function (resolve, reject) {
        rl.question(desc + ' (' + defaultValue + '): ', function (answer: string) {
            var value = answer.trim();
            if ((key === 'appId' || key === 'localPort') && (!/^\d+$/.test(value))) {
                console.log(typeof value)
                reject('Invalid ' + desc + ', Positive Integer Value Required, Please Retry');
                return
            }
            if ((key === 'soaServerId') && (value == null || value === '')) {
                reject('Invalid ' + desc + ', Positive String Value Required, Please Retry');
                return
            }
            if ((key === 'serverVd') && !value && (typeof value != 'string')) {
                reject('Invalid ' + desc + ', Positive String Value Required, Please Retry');
                return
            }
            opts[key] = value;
            resolve();
        });
    }).catch((err) => {
        console.log(err);
        // @ts-ignore
        return getOption.apply(null, arguments);
    });
}


var action = process.argv[2] + (process.argv[3] ? " " + process.argv[3] : "");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.pause();

switch (action) {
    case 'init':
        doInit();
        break;
    case 'init soaServer':
        doInit('soaServer');
        break;
    case 'guidebook':
        guidebook();
        break;
    case 'update':
        break;
    case 'help':
    default:
        showHelp();
        break;
}


export { }