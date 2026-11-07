'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');
const api     = require('../modules');
const cents   = utils.number.cents.bind(utils.number);

module.exports = { // Usamos a tabela ORDENS, com status 'R'
    read: async params => {
        try {
            const { numero, nome, inicio, final, ordem, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

            let sql      = '';
            let sqlCount = '';
            let sqlWhere = `where ORDENS_ID > 0 `;
            let sqlOrder = '';
            
            if(numero) {
                sqlWhere += ` and  ORDENS_NUMERO = '${numero}' `;
            }

            if(nome) {
                sqlWhere += ` and ORDENS_NOME like '${nome}%' `;
            }

            if(ordem == 0) {
                sqlWhere += ` and ORDENS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
            }
            
            if(ordem == 1) {
                sqlOrder = ' order by ORDENS_NOME, ORDENS_EMISSAO ';
            }

            sqlCount  = `select count(*) from ORDENS ${sqlWhere} `;
            sql = `select ${limits} *                     
                from ORDENS
                left outer join BANCOS on BANCOS_ID = ORDENS_ID_TECNICO
                ${sqlWhere} ${sqlOrder}`;

            const total   = await samosFB.count(sqlCount, params);
            const telemarketings = await samosFB.executeSQL(sql, params);

            return { results: telemarketings, total }
        } catch(error) {
            const msg = 'Falha ao buscar recibos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const sql = `select * from ORDENS where ORDENS_ID = '${id}'`;
            const results = await samosFB.executeSQL(sql, params);
            
            return { results };
        } catch(error) {
            const msg = 'Falha ao buscar recibo por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (ordem, params) => {
        try {

            const { numero, serie } = await samosFB.ultimoDocto('ORDENS', ordem, params);

            ordem['ORDENS_NUMERO']      = numero;
            ordem['ORDENS_SERIE']       = serie;

            await samosFB.insert('ORDENS', ordem, params);
            await utils.dblog(params); 

            return { results: ordem };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar recibo' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, ordem, params) => {
        try {

            await samosFB.update(id, 'ORDENS', ordem, params);
            await utils.dblog(params);

            return { results: ordem };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar recibo' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'ORDENS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar recibo';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};