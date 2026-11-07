'use strict';

const samosFB = require('../services/samosFB');
const utils   = require('../services/samosUtils');

const fs      = require('fs');
const mkdirp  = require('mkdirp');
const path    = require('path');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { idPessoa } = params;

            const results = readFiles(idPessoa, params);
            
            return { results, total: results.length };

        } catch(error) {
            const msg = error.message ? 'Falha ao listar arquivos' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (data, params, req) => {
        try{

            const data      = req.body;
            const id        = await lastId(params);
            const idPessoa  = data['PESSOASDOCUMENTOS_ID_PESSOAS'] || '0';
            const numero    = data['PESSOASDOCUMENTOS_NUMERO']     || moment().add(1, 'year').format('YYYY-MM-DD');
            const documento = data['PESSOASDOCUMENTOS_DOCUMENTO']  || (req.files.file.name ? (req.files.file.name || '').split('/').pop().split('.')[0] : new Date().getTime());
            const log       = params.userName + ' ' + moment.tz(params.timezone).format('DD.MM.YYYY HH.mm.ss');
            const inclusao  = moment().format('YYYY-MM-DD');
            const validade  = data['PESSOASDOCUMENTOS_VALIDADE'] || new Date().getTime().toString().slice(5,10);
            const extensao  = data['PESSOASDOCUMENTOS_EXTENSAO'] || 'pdf';

            const caminhoArquivos = path.join(process.cwd(), '..', params.client, 'uploads', 'pessoasdocumentos', idPessoa);
            const nomeArquivo     = `${id}_${idPessoa}_${numero}_${documento}_${log}_${inclusao}_${validade}.${extensao}`;
            const localTemporario = req.files.file.path;
            const caminhoCompleto = path.join(caminhoArquivos, nomeArquivo);
            
            if (!fs.existsSync(caminhoArquivos)){
                await mkdirp(caminhoArquivos)
            }
            
            //fs.renameSync(localTemporario, caminhoCompleto);
            fs.copyFileSync(localTemporario, caminhoCompleto);
            fs.unlinkSync(localTemporario);

            await utils.dblog(params); 

            return { id }
        } catch(error){
            const msg = error.message ? 'Falha ao carregar arquivo' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        const ids = (params.ids || '').split(',').map(id => parseInt(id));
        const caminhoArquivos = path.join(process.cwd(), '..', params.client, 'uploads', 'pessoasdocumentos', params.idPessoa);

        try {
            const fileList = fs.readdirSync(caminhoArquivos);
            const arquivos = fileList.filter(fileName => {
                return ids.indexOf(parseInt(fileName.split('_')[0])) != -1;
            });

            for(let i = 0; i < arquivos.length; i++) {
                const file = arquivos[i];
                const caminhoCompleto = path.join(caminhoArquivos, file);

                if(fs.existsSync(caminhoCompleto)){
                    const temp = new Date().getTime().toString();
                    fs.renameSync(caminhoCompleto, temp);
                    fs.unlinkSync(temp);
                }
            }
            
            utils.dblog(params);
        } catch(error){
            const msg = error.message ? 'Falha ao deletar arquivos' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const readFiles = (idPessoa, params) => {
    const diretorio = path.join(process.cwd(), '..', params.client, 'uploads', 'pessoasdocumentos', idPessoa);

    if(fs.existsSync(diretorio)) {
        const fileList = fs.readdirSync(diretorio);
    
        return fileList
            .map(fileName => {
                const partes = fileName.split('_');
    
                return {
                    'PESSOASDOCUMENTOS_ID'        : partes[0],
                    'PESSOASDOCUMENTOS_ID_PESSOAS': partes[1],
                    'PESSOASDOCUMENTOS_NUMERO'    : partes[2],
                    'PESSOASDOCUMENTOS_DOCUMENTO' : partes[3],
                    'PESSOASDOCUMENTOS_LOG'       : partes[4],
                    'PESSOASDOCUMENTOS_INCLUSAO'  : partes[5],
                    'PESSOASDOCUMENTOS_VALIDADE'  : partes[6].split('.')[0],
                    'PESSOASDOCUMENTOS_EXTENSAO'  : partes[partes.length - 1].split('.').pop(),
                    'PESSOASDOCUMENTOS_CAMINHO'   : path.join('pessoasdocumentos', idPessoa, fileName)
                };
            })
            .sort(function (a, b) {
                if (parseInt(a['PESSOASDOCUMENTOS_ID']) > parseInt(b['PESSOASDOCUMENTOS_ID'])) {
                    return 1;
                }
                if (parseInt(a['PESSOASDOCUMENTOS_ID']) < parseInt(b['PESSOASDOCUMENTOS_ID'])) {
                    return -1;
                }
                return 0;
            });
    } else {
        return [];
    }
};

const lastId = async function(params) {
    return new Promise(async (resolve, reject) => {
        let sql = '';

        try {
            sql = `execute block returns (ULTIMO integer) as
                declare variable incremento integer;
                begin
                incremento = gen_id(GEN_PESSOASDOCUMENTOS_ID, 1);
                ultimo = incremento;
                suspend;
                end; `;
            
            const results = await samosFB.executeSQL(sql, params);
            const result  = results[0] ? parseInt(results[0]['ULTIMO']) : 0;
            
            if(result >= 0) {
                resolve(result);
            } else {
                reject('LastId Error PESSOASDOCUMENTOS');
            }

        } catch(error) {
            reject(error);
        }
    });
}