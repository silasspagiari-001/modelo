'use strict';

const child_process  = require('child_process');
const pm2            = require('pm2');
const path           = require('path');
const appRoot        = path.dirname(require.main.filename);
const utils          = require('./samosUtils');
const moment         = require('moment-timezone');

const cmd = function(command) {
    return new Promise((resolve, reject) =>  {
        try {
            child_process.exec(command, function(err, stdout, stderr) {
                if(err){
                    reject(stderr);
                } else {
                    resolve(`${command}\n${stdout}\n`);
                }
            });
        } catch(err) {
            reject(err);
        }
    });
};

module.exports = async (req, res, next) => {
    let msg     = '';
    let comando = '';

    try {
        msg += 'DEPLOY ' + moment().format('DD/MM/YYYY') + '\n';

        comando = `cd ${appRoot}`;
        msg     += await cmd(comando);

        comando = `git clean -f`;
        msg     += await cmd(comando);

        comando = `git reset --hard HEAD`;
        msg     += await cmd(comando);

        comando = `git checkout master`;
        msg     += await cmd(comando);

        comando = `git pull origin master`;
        msg     += await cmd(comando);

        comando = `npm install`;
        msg     += await cmd(comando);

        res.set('content-type', 'text/plain');
        res.send(msg);
    
        console.log(msg);

        const serviceName = process.env['SERVICE_NAME'];

        pm2.connect(async error => {
            if (error) {
                console.log(error);
                await cmd(`pm2 restart ${serviceName}`);
            } else {
                pm2.restart(serviceName, async error => {
                    if (error) {
                        console.log(error);
                        await cmd(`pm2 restart ${serviceName}`);
                    }
                });
            }
        });
    } catch(error) {
        res.status(400).json({ err: error.toString() });
        console.log('updategit.js: ' + error.toString());
    }
};