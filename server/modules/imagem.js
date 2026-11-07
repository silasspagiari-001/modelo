'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
    read: (params, req, res) => {
        return new Promise(async (resolve, reject) => {
            let contentType = 'image/png';
            let caminho = params.caminho || '';

            if(!caminho) {
                resolve({ results: [], total: 0 })
                console.log(`Parameter 'caminho' required`);
                return;

            } else if(!contentType) {
                resolve({ results: [], total: 0 })
                console.log(`Parameter 'contentType' required`);
                return;
            }

            caminho = path.join(process.cwd(), 'resources', caminho);

            fs.stat(caminho, (err, stats) => {
                if (err) {
                    resolve({ results: [], total: 0 })
                    console.log(`Not Found streaming: ${caminho}`);
                    return;
                }
                if (!stats.size) {
                    resolve({ results: [], total: 0 })
                    console.log(`Empty file: ${caminho}`);
                    return;
                }

                let range;
                let start = Number((range || '').replace(/bytes=/, '').split('-')[0]);
                let size = stats.size;
                let end = size - 1;

                start = start > end ? end : start;

                let chunkSize = (end - start) + 1;
                let stream;
                let fileName = caminho.split('/').pop();
                let headers = {
                    'Content-Range': `bytes ${start}-${end}/${size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': contentType,
                    'Content-Disposition': `filename=${fileName}`
                };

                res.set(headers);

                stream = fs.createReadStream(caminho, { start, end });

                stream.on('open', () => {
                    stream.pipe(res)
                });

                stream.on('error', streamErr => {
                    console.log(`Error while streaming ${caminho}. Error: ${streamErr}`);
                    res.end(streamErr);
                });
            });
        });
    }
};