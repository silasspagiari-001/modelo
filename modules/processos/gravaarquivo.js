'use strict';

const fs        = require('fs');
const os        = require('os');
const mkdirp    = require('mkdirp');
const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const { sleep } = require('../../services/samosUtils');

module.exports = {
    create: async (data, params, req) => {
        try {
            const { nomeArquivo, conteudo, base64 } = data;

            let caminho = `${appRoot}/public/`;

            if(os.platform().match(/linux|darwin/)) {
                caminho = caminho.replace(/\\/ig, '/');
            } else {
                caminho = caminho.replace(/\//ig, '\\');
            }

            if (!fs.existsSync(caminho)){
                await mkdirp(caminho);
            }

            if(base64) {
                const base64File = base64.split(';base64,').pop();
                fs.writeFileSync(`${caminho}${nomeArquivo}`, base64File, { encoding: 'base64' });
            } else if(req.files && req.files.file) {
                fs.copyFileSync(req.files.file.path, `${caminho}/${nomeArquivo}`);
                fs.unlinkSync(req.files.file.path);
            } else {
                fs.writeFileSync(`${caminho}${nomeArquivo}`, conteudo);
            }

            await sleep(500);
            
            return {
                results: `public/${nomeArquivo}`,
                total: 0
            }

        } catch(error) {
            const msg = error.message ? 'Falha ao gravar arquivo' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};