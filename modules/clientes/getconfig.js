'use strict';

const fs    = require('fs');
const path  = require('path');

module.exports = {
    read: async (params, req, res) => {
        try {
            const configJSPath   = path.join(process.cwd(), '..', params.client, 'configs', 'config.js');
            const configJSONPath = path.join(process.cwd(), '..', params.client, 'configs', 'config.json');
            
            let stream;
    
            if(fs.existsSync(configJSONPath)) {
                stream = fs.createReadStream(configJSONPath, {encoding: 'binary'});
                stream.on('open', () => stream.pipe(res));
                stream.on('error', error => res.end(error));
            } else if(fs.existsSync(configJSPath)) {
                stream = fs.createReadStream(configJSPath, {encoding: 'binary'});
                stream.on('open', () => stream.pipe(res));
                stream.on('error', error => res.end(error));
            }
    
            return stream;

        } catch(error) {
            const msg = 'Falha ao buscar config';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};