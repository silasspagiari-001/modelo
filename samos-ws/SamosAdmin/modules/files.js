'use strict';

const samosFB = require('../services/samosFirebird');
const fs      = require('fs');
const utils   = require('../services/samosUtils');
const mkdirp  = require('mkdirp');
const path    = require('path');
const appRoot = path.dirname(require.main.filename);
const os      = require('os');
const iconv   = require('iconv-lite');
const eol     = require('eol');

module.exports = {
    read: (params, req, res) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { forcedownload, contentType, publicFolder, path } = params;
                let decodedPath;

                if(!path) {
                    samosFB.enviarRespostaErro(`Parameter 'path' required`, null, null, reject);
                    return;
            
                } else if(!contentType) {
                    samosFB.enviarRespostaErro(`Parameter 'contentType' required`, null, null, reject);
                    return;
                }

                if(publicFolder) {
                    decodedPath = `${appRoot}/public/${(path || '').split('public/')[1]}`
                } else {
                    const encodedPath = path || '';
                    //atob(atob(encodedPath).split('').reverse().join(''))
                    decodedPath = Buffer.from(Buffer.from(encodedPath, 'base64').toString().split('').reverse().join(''), 'base64').toString();
                }

                fs.stat(decodedPath, (err, stats) => {
                    if (err) {
                        samosFB.enviarRespostaSucesso(null, [{msg: `Not Found streaming: ${decodedPath}`}], 0, resolve);
                        return;
                    }
                    if (!stats.size) {
                        samosFB.enviarRespostaSucesso(null, [{msg: `Empty file: ${decodedPath}`}], 0, resolve);
                        return;
                    }
            
                    let start = Number((req.get('range') || '').replace(/bytes=/, '').split('-')[0]);
                    let size = stats.size;
                    let end = size - 1;

                    start = start > end ? end : start;

                    let chunkSize = (end - start) + 1;
                    let stream;
                    let fileName = decodedPath.split('/').pop();
                    let headers = {
                        'Content-Range': `bytes ${start}-${end}/${size}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunkSize,
                        'Content-Type': contentType
                    };
            
                    if(forcedownload){
                        headers['Content-disposition'] = 'attachment;filename="' + fileName + '"';
                    }
            
                    res.set(headers);
                    stream = fs.createReadStream(decodedPath, { start, end });
            
                    stream.on('open', () => {
                        stream.pipe(res);
                    });
            
                    stream.on('error', streamErr => {
                        console.log(`Error while streaming ${decodedPath}. Error: ${streamErr}`);
                        res.end(streamErr);
                    });
                });
            } catch(e) {
                console.log('Catch: Streaming line 74 - ' + e);
            }
        });
    },

    create: (data, params, req) => {
        return new Promise(async (resolve, reject) => {
            try{
                const body = req.body;

                let oldPath;
                let newPath;
                let path;

                if(body.move == 'true' || body.move === true) {
                    if(os.platform().match(/linux|darwin/)) {
                        oldPath   = `${appRoot}/public/${body.oldFile}`.replace(/\\/ig, '/');
                        newPath   = `${appRoot}/public/${body.newFile}`.replace(/\\/ig, '/');
                        const dir = newPath.split('/');
                        dir.pop();
                        path   = dir.join('/');
                    } else {
                        oldPath   = `${appRoot}/public/${body.oldFile}`.replace(/\//ig, '\\');
                        newPath   = `${appRoot}/public/${body.newFile}`.replace(/\//ig, '\\');
                        const dir = newPath.split('\\');
                        dir.pop();
                        path   = dir.join('\\');
                    }
                } else {
                    const fileName     = body.fileName || (req.files.file.name ? (req.files.file.name || '').split('/').pop() : new Date().getTime());
                    const publicFolder = body.publicFolder === true || body.publicFolder === 'true';
                    
                    path         = publicFolder ? `${appRoot}/public/${body.path}` : (body.path || `${appRoot}/public`);
                    oldPath      = req.files.file.path;
                    newPath      = `${path}/${fileName}`;

                    if(os.platform().match(/linux|darwin/)) {
                        path = path.replace(/\\/ig, '/');
                    } else {
                        path = path.replace(/\//ig, '\\');
                    }
                }

                if (!fs.existsSync(path)){
                    await mkdirp(path);
                }
                
                if(os.platform().match(/linux|darwin/)) {
                    oldPath = oldPath.replace(/\\/ig, '/');
                    newPath = newPath.replace(/\\/ig, '/');
                } else {
                    oldPath = oldPath.replace(/\//ig, '\\');
                    newPath = newPath.replace(/\//ig, '\\');
                }
        
                //encoding win1252 por default (padrão windows)
        
                const partes   = newPath.split('.');
                const extensao = (partes[partes.length - 1] || '').toLowerCase();
        
                if(extensao == 'txt' || extensao == 'rem' || extensao == 'dat'){
                    const data          = fs.readFileSync(oldPath);
                    const fileString    = Buffer.from(data).toString();
                    const windowsString = eol.crlf(fileString);
                
                    fs.writeFileSync(oldPath, windowsString);

                    fs.createReadStream(oldPath)
                        .pipe(iconv.decodeStream('utf-8'))
                        .pipe(iconv.encodeStream('win1252'))
                        .pipe(fs.createWriteStream(newPath));
        
                    setTimeout(() => {
                        fs.unlinkSync(oldPath);
                        samosFB.enviarRespostaSucesso(null, [{msg: `Sucesso`}], 0, resolve);
                    }, 500);
                } else {
                    fs.copyFileSync(oldPath, newPath);
                    fs.unlinkSync(oldPath);
                    samosFB.enviarRespostaSucesso(null, [{msg: `Sucesso`}], 0, resolve);
                }

            } catch(error){
                samosFB.enviarRespostaErro('Erro ao fazer upload', null, error.toString(), reject);
                console.log('Erro ao fazer upload: ' + error.toString());
            }
        });
    }
};