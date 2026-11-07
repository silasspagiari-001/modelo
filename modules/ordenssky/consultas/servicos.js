'use strict';

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    readById: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);

            const sqlSearch = `
                select
                    ORDENSSERVICOS_ID,
                    ORDENSSERVICOS_QUANTIDADE,
                    SERVICOS_NOME
                from ORDENSSERVICOS 
                join SERVICOS on ORDENSSERVICOS_ID_SERVICOS = SERVICOS_ID
                where ORDENSSERVICOS_ID_ORDENS = '${id}'
                order by ORDENSSERVICOS_ID `; 

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({ db, results, total: 1, resolve, reject });
                }
            });
        });
    }
};