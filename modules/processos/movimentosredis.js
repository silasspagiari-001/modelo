'use strict';

const utils      = require('../../services/samosUtils');
const samosRedis = require('../../services/samosRedis');

module.exports = {
    read: async params => {
        try {
            const where = [];

            const movimentos = await samosRedis.query('MOVIMENTOSREDIS', where, params);

            return { results: movimentos }
            
        } catch(error) {
            const msg = 'Falha ao buscar movimentos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const movimentos = await samosRedis.query('MOVIMENTOSREDIS', [{
                key: 'MOVIMENTOS_ID',
                on: '==',
                value: id
            }], params);

            return movimentos;
        } catch(error) {
            const msg = 'Falha ao buscar movimentos por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (movimento, params) => {
        try {
            await samosRedis.insert('MOVIMENTOSREDIS', movimento, params);
            return movimento;
        } catch(error) {
            const msg = 'Falha ao criar movimento redis';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosRedis.delete(id, 'MOVIMENTOSREDIS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar movimento redis';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};