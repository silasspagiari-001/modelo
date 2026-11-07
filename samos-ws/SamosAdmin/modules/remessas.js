'use strict';

const fs      = require('fs');
const os      = require('os');
const iconv   = require('iconv-lite');
const eol     = require('eol');
const mkdirp  = require('mkdirp');
const path    = require('path');
const appRoot = path.dirname(require.main.filename);
const samosFB = require('../services/samosFirebird');
const utils   = require('../services/samosUtils');
const api     = require('../modules');

module.exports = {
    readById: (id, params) => {
        return new Promise((resolve, reject) => {
            const clientFolder = params.client ? `public/remessas/${params.client}` : `public/remessas`;
            
            let folder;

            if(os.platform().match(/linux|darwin/)) {
                folder = (`${appRoot}/${clientFolder}/${id}/`).replace(/\\/ig, '/');
            } else {
                folder = (`${appRoot}/${clientFolder}/${id}/`).replace(/\//ig, '\\');
            }

            if (!fs.existsSync(folder)){
                samosFB.enviarRespostaSucesso(null, [{msg: 'Sem arquivos para este portador'}], 0, resolve);
            }

            fs.readdir(folder, async (error, paths) =>{
                if(error){
                    samosFB.enviarRespostaSucesso(null, [{msg: 'Sem arquivos para este portador'}], 0, resolve);
                } else {
                    const results = paths.map(fileName => {
                        let path;

                        if(os.platform().match(/linux|darwin/)) {
                            path = `${appRoot}/${clientFolder}/${id}/${fileName}`.replace(/\\/ig, '/');
                        } else {
                            path = `${appRoot}/${clientFolder}/${id}/${fileName}`.replace(/\//ig, '\\');
                        }

                        const stats = fs.statSync(path);

                        return {
                            ARQUIVOS_NOME: path.replace(/\\/ig, '/'),
                            ARQUIVOS_CRIACAO: stats.birthtime,
                            ARQUIVOS_TAMANHO: convertSize(stats.size)
                        };
                    })
                    .filter(result => result['ARQUIVOS_TAMANHO'] != 0);

                    samosFB.enviarRespostaSucesso(null, results, results.length, resolve);
                }
            });
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            try{
                const { nomeArquivo, conteudo, portador } = data;
                const clientFolder = params.client ? `public/remessas/${params.client}` : `public/remessas`;

                let arquivoConteudo = '';

                if(fs.existsSync(conteudo)) {;
                    arquivoConteudo = fs.readFileSync(conteudo, 'utf8');
                }

                let path = `${appRoot}/${clientFolder}/${portador}/`;

                if(os.platform().match(/linux|darwin/)) {
                    path = path.replace(/\\/ig, '/');
                } else {
                    path = path.replace(/\//ig, '\\');
                }

                if (!fs.existsSync(path)){
                    await mkdirp(path);
                }

                let crlfString = eol.crlf(arquivoConteudo);
        
                const winString  = iconv.encode(crlfString, 'win1252');
                
                fs.writeFileSync(`${path}${nomeArquivo}`, winString);
    
                setTimeout(() => {
                    samosFB.enviarRespostaSucesso(null, `${clientFolder}/${portador}/${nomeArquivo}`, 0, resolve);
                }, 500);

            } catch(error){
                samosFB.enviarRespostaErro('Erro ao fazer upload', null, error.toString(), reject);
                console.log('Erro ao fazer upload: ' + error.toString());
            }
        })
    },

    update: (id, data, params) => {
        return new Promise((resolve, reject) => {
            let oldPath;
            let newPath;
            const fileName = params.fileName;
            const extensao = (params.path || '').split('.').pop();

            if(os.platform().match(/linux|darwin/)) {
                oldPath = (params.path || '').replace(/\\/ig, '/');
                newPath = oldPath.replace(oldPath.split('/').pop(), fileName) + '.' + extensao;
            } else {
                oldPath = (params.path || '').replace(/\//ig, '\\');
                newPath = oldPath.replace(oldPath.split('\\').pop(), fileName) + '.' + extensao;
            }

            if (!fs.existsSync(oldPath)){
                samosFB.enviarRespostaSucesso(null, [{msg: 'Arquivo não encontrado'}], 0, resolve);
            }
           
            try{
                fs.rename(oldPath, newPath, function (errRename) {
                    if (errRename) {
                        samosFB.enviarRespostaErro(`Error renaming: ${newPath}. Error ${errRename}`, null, null, reject);
                    } else {
                        api.remessas().readById(id, params)
                            .then(res => {
                                samosFB.enviarRespostaSucesso(null, res.results, 0, resolve);
                            });
                    }
                });
        
            } catch(e) {
                samosFB.enviarRespostaErro('Catch: Streaming line 82 - ' + e, null, null, reject);
                console.log('Catch: Streaming line 83 - ' + e);
            }
        });
    },

    delete: (id, params) => {
        return new Promise((resolve, reject) => {
            const { arquivos } = params;
            const listaArquivos = (arquivos || '').split(',');
            
            try{
                listaArquivos.forEach(arquivo => {
                    if (fs.existsSync(arquivo)){
                        fs.unlinkSync(arquivo);
                    }
                });

                setTimeout(() => {
                    samosFB.enviarRespostaSucesso(null, [], 0, resolve);
                }, 1000);
        
            } catch(e) {
                samosFB.enviarRespostaErro('Catch: Streaming line 82 - ' + e, null, null, reject);
                console.log('Catch: Streaming line 83 - ' + e);
            }
        });
    }
};

const convertSize = function (bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 0;
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};
