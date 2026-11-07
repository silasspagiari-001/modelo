'use strict';

const fs        = require('fs');
const os        = require('os');
const mkdirp    = require('mkdirp');
const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const { sleep } = require('../../services/samosUtils');
const moment  = require('moment-timezone');

function getCreatedDate (file) {  
    const { birthtime } = fs.statSync(file);
    return birthtime;
}

function getFileSize(file){
    const { size } = fs.statSync(file);
    return size;
}

module.exports = {
    read: async (data, params, req) => {
        try {
            let { subpasta, foto } = data;

            let caminho = `${appRoot}/public/${subpasta}/`;
            
            const fotoPath = `${caminho}${foto}`,
                  dataCriacao = getCreatedDate(fotoPath);

            if(os.platform().match(/linux|darwin/)) {
                caminho = caminho.replace(/\\/ig, '/');
            } else {
                caminho = caminho.replace(/\//ig, '\\');
            }

            await sleep(500);

            return {
                results: [
                    {
                        'FOTOS_NOME'     : foto,
                        'FOTOS_EXTENSAO' : 'jpeg',
                        'FOTOS_BYTES'    : getFileSize(fotoPath),
                        'FOTOS_DATA'     : moment(dataCriacao).format('YYYY-MM-DD'),
                        'FOTOS_HORA'     : moment(dataCriacao).format('hh:mm:ss'),
                        'FOTOS_BASE64'   : fs.readFileSync(fotoPath, {encoding: 'base64'})
                    }
                ],
                total: 1
            }

        } catch(error) {
            const msg = error.message ? 'Falha ao gravar foto' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};