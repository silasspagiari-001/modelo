'use strict';

const utils      = require('../../services/samosUtils');
const samosRedis = require('../../services/samosRedis');

module.exports = {
    read: async params => {
        try {
            const where = [{
                key: 'ETIQUETAS_STATUS',
                on: '==',
                value: 'F'
            }];

            const etiquetas = await samosRedis.query('ETIQUETAS', where, params);

            return { results: etiquetas }
            
        } catch(error) {
            const msg = 'Falha ao buscar etiquetas';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const etiquetas = await samosRedis.query('ETIQUETAS', [{
                key: 'ETIQUETAS_ID',
                on: '==',
                value: id
            }], params);

            return etiquetas;
        } catch(error) {
            const msg = 'Falha ao buscar etiqueta por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (etiqueta, params) => {
        try {
            await samosRedis.insert('ETIQUETAS', etiqueta, params);
            return etiqueta;
        } catch(error) {
            const msg = 'Falha ao criar etiqueta';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, etiqueta, params) => {
        try {
            await samosRedis.insert('ETIQUETAS', etiqueta, params);
            await utils.dblog(params);

            return etiqueta;
        } catch(error) {
            const msg = 'Falha ao alterar etiqueta';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosRedis.delete(id, 'ETIQUETAS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar etiqueta';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};