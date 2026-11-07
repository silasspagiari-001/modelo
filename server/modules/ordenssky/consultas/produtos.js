'use strict';

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    readById: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);

            const sqlSearch = `
                select
                    ORDENSPRODUTOS_ID,
                    ORDENSPRODUTOS_QUANTIDADE,
                    PRODUTOS_NOME
                from ORDENSPRODUTOS 
                join PRODUTOS on ORDENSPRODUTOS_ID_PRODUTOS = PRODUTOS_ID
                where ORDENSPRODUTOS_ID_ORDENS = '${id}'
                order by ORDENSPRODUTOS_ID `; 

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