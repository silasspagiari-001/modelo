'use strict';

const fs    = require('fs');
const path  = require('path');
const utils = require('../../services/samosUtils')

module.exports = {
    read: async (params, req, res) => {
        try {
            //tira os ".." para não permitir sair da pasta do cliente
            const caminho = (params.caminho || '').replace(/\.\./ig, '');
            
            const imagePath = utils.client.getImagePath(caminho, params);
    
            const stream = fs.createReadStream(imagePath);

            stream.on('open', () => stream.pipe(res));
            stream.on('error', error => res.end(error));
            
            return stream;
    
        } catch(error) {
            const msg = 'Falha ao buscar imagem';
            //console.log(msg);
            //console.log(error);
            throw { msg, error };
        }
    }
};