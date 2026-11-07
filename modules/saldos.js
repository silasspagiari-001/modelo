'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { produto, empresa } = params || {};
            const db = await samosFB.conectarBanco(params.client);
            let sqlEmpresa = empresa ? `and SALDOS_ID_EMPRESAS = '${empresa}' ` : '';
            let sqlProduto = produto ? `and SALDOS_ID_PRODUTOS = '${produto}' ` : '';
            let sqlWhere = `where SALDOS_ID > 0  ${sqlEmpresa} ${sqlProduto}`;

            const sqlSearch = `select * from SALDOS ${sqlWhere} order by SALDOS_ID`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: 999999, resolve, reject});
                }
            });
        });
    }
};
