'use strict';

const utils      = require('../../services/samosUtils');
const samosRedis = require('../../services/samosRedis');

module.exports = {
    read: async params => {
        try {
            const where = [{
                key: 'NOTIFICACAO_STATUS',
                on: '==',
                value: 'T'
            }];

            const liberacoes = await samosRedis.query('NOTIFICACAO', where, params);

            return { results: etiquetas }
            
        } catch(error) {
            const msg = 'Falha ao buscar liberacoes';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const liberacoes = await samosRedis.query('NOTIFICACAO', [{
                key: 'NOTIFICACAO_ID',
                on: '==',
                value: id
            }], params);

            return liberacoes;
        } catch(error) {
            const msg = 'Falha ao buscar liberação por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (liberacao, params) => {
        try {
            await samosRedis.insert('NOTIFICACAO', liberacao, params);
            return etiqueta;
        } catch(error) {
            const msg = 'Falha ao criar liberacao';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, liberacao, params) => {
        try {
            await samosRedis.insert('NOTIFICACAO', liberacao, params);
            await utils.dblog(params);

            return liberacao;
        } catch(error) {
            const msg = 'Falha ao alterar liberação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosRedis.delete(id, 'NOTIFICACAO', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao excluir liberação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};