'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');
const api     = require('../modules');

module.exports = {
    read: async params => {

        try {
            const { transportador, fornecedor, cliente, inicio, final, ordem, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

            let sql      = '';
            let sqlCount = '';
            let sqlWhere = `where COLETAS_ID > 0 `;
            let sqlOrder = '';

            if(transportador) {
                sqlWhere += ` and COLETAS_ID_USUARIOS = '${transportador}' `; // Transportador
            }

            if(fornecedor) {
                sqlWhere += ` and COLETAS_ID_FORNECEDOR = ${fornecedor} `; // Remetente
            }           

            if(cliente) {
                sqlWhere += ` and COLETAS_ID_PESSOAS = '${cliente}' `; // Destinatário
            }

            if(ordem == 0) {
                sqlWhere += ` and COLETAS_AGENDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
            }
            
            const sqlSearch = `
                        select COLETAS.*, 
                               FORNECEDORES.PESSOAS_NOME as FORNECEDOR_NOME,
                               CLIENTES.PESSOAS_NOME     as CLIENTE_NOME
                        from COLETAS
                        left outer join PESSOAS as FORNECEDORES on FORNECEDORES.PESSOAS_ID = COLETAS_ID_FORNECEDOR
                        left outer join PESSOAS as CLIENTES     on CLIENTES.PESSOAS_ID     = COLETAS_ID_PESSOAS
                        left outer join USUARIOS                on USUARIOS_ID             = COLETAS_ID_USUARIOS
                        ${sqlWhere}
                        order by COLETAS_AGENDA, COLETAS_HORAAGENDA`;
    
            const coletas = await samosFB.executeSQL(sqlSearch, params);

            

            console.log('sql', sqlSearch, ' coletas: ', coletas)

            return { results: coletas }
        } catch(error) {
            const msg = 'Falha ao buscar coletas';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const sql = `select * from COLETAS where COLETAS_ID = '${id}'`;
            const results = await samosFB.executeSQL(sql, params);
            
            return { results };
        } catch(error) {
            const msg = 'Falha ao buscar coletas por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (coleta, params) => {
        try {

            const { numero, serie } = await samosFB.ultimoDocto('COLETAS', coleta, params);

            coleta['COLETAS_NUMERO']  = coleta['COLETAS_NUMERO']  || numero;
            coleta['COLETAS_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            coleta['COLETAS_LOG'] = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;
            
            await samosFB.insert('COLETAS', coleta, params);
            await utils.dblog(params); 

            return { results: coleta };
        } catch(error) {
            const msg = error.message ? 'Falha ao gravar coleta' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, coleta, params) => {
        try {
            coleta['COLETAS_LOG'] = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;

            await samosFB.update(id, 'COLETAS', coleta, params);
            await utils.dblog(params);

            return { results: coleta };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar coleta' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'COLETAS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao excluir coleta';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }

};