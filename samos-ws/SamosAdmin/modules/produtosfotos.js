'use strict';

const samosFB = require('../services/samosFB');
const utils   = require('../services/samosUtils');

const fs      = require('fs');
const mkdirp  = require('mkdirp');
const path    = require('path');
const appRoot = path.dirname(require.main.filename);
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { idProduto } = params;

            const results = readFiles(idProduto, params);
            
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
            const idProduto = data['PRODUTOSFOTOS_ID_PRODUTOS'] || '0';
            const caminhoArquivos = `${appRoot}/public/uploads/${params.client || 'turbotec'}/produtos/${idProduto}`;
            const proximoArquivo = await obterNomeDisponivel(caminhoArquivos);
            const id = proximoArquivo.split('.')[0] || '1';
            const nomeArquivo     = `${proximoArquivo}`;
            const localTemporario = req.files.file.path;
            const caminhoCompleto = path.join(caminhoArquivos, nomeArquivo);
            
            if (!fs.existsSync(caminhoArquivos)){
                await mkdirp(caminhoArquivos)
            }
            
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
        const caminhoArquivos = `${appRoot}/public/uploads/${params.client || 'turbotec'}/produtos/${params.idProduto}`;

        try {
            const fileList = fs.readdirSync(caminhoArquivos);

            const arquivos = fileList.filter(fileName => {
                return ids.indexOf(parseInt(fileName.split('.')[0])) != -1;
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

const readFiles = (idProduto, params) => {

    const diretorio = path.join(process.cwd(), 'public', 'uploads', (params.client || 'turbotec'), 'produtos', idProduto);

    if(fs.existsSync(diretorio)) {
        const fileList = fs.readdirSync(diretorio);
   
        return fileList
            .map(fileName => {

                let fileTarget = path.join(diretorio, fileName);

                let logFile = fs.statSync(fileTarget).ctime.toLocaleString('pt-BR');

                const partes = fileName.split('.');
    
                return {
                    'PRODUTOSFOTOS_ID'         : partes[0],
                    'PRODUTOSFOTOS_ID_PRODUTOS': idProduto,
                    'PRODUTOSFOTOS_DESCRICAO'  : 'Foto' + partes[0].toString(),
                    'PRODUTOSFOTOS_EXTENSAO'   : partes[1],
                    'PRODUTOSFOTOS_CAMINHO'    : path.join(diretorio, fileName),
                    'PRODUTOSFOTOS_LOG'        : logFile
                };
            })
            .sort(function (a, b) {
                if (parseInt(a['PRODUTOSFOTOS_ID']) > parseInt(b['PRODUTOSFOTOS_ID'])) {
                    return 1;
                }
                if (parseInt(a['PRODUTOSFOTOS_ID']) < parseInt(b['PRODUTOSFOTOS_ID'])) {
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
                incremento = gen_id(GEN_PRODUTOSFOTOS_ID, 1);
                ultimo = incremento;
                suspend;
                end; `;
            
            const results = await samosFB.executeSQL(sql, params);
            const result  = results[0] ? parseInt(results[0]['ULTIMO']) : 0;
            
            if(result >= 0) {
                resolve(result);
            } else {
                reject('LastId Error PRODUTOSFOTOS');
            }

        } catch(error) {
            reject(error);
        }
    });
};

const obterNomeDisponivel = async function(pasta) {
    let numero = 1;
    let nomeArquivo;
  
    do {
      nomeArquivo = `${numero}.jpg`;
      numero++;
    } while (fs.existsSync(path.join(pasta, nomeArquivo)));
  
    return nomeArquivo;
  }