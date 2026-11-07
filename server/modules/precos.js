'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, tipo, produtoinicial, produtofinal, grupoinicial, grupofinal, pessoa, situacao} = params;
            const db = await samosFB.conectarBanco(params.client);
            let sqlWhere = (tipo == 2 ? 'SALDOS_PRAZO > 0 and ' : '');
            let isRacaforte = (params.client || 'RACAFORTE').toUpperCase().match(/RACAFORTE/);


            sqlWhere += (situacao == 0 ? 'SALDOS_DISPONIVEL > 0 and ' : '');
            sqlWhere += pessoa > 0 ? `PRODUTOS_ID_PESSOAS = ${pessoa} and ` : '';

            let sqlSearch = `
              select PRODUTOS_ID, 
                     PRODUTOS_NOME, 
                     PRODUTOS_UNIDADE, 
                     PRODUTOS_ID_GRUPOS, 
                     SALDOS_PRECO, 
                     SALDOS_PRAZO, 
                     GRUPOS_NOME
              from PRODUTOS
              left outer join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
              left outer join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
              where PRODUTOS_ID between ${produtoinicial} and ${produtofinal} and
                    ${isRacaforte ? `
                        PRODUTOS_STATUS = 'T' and` : ''}
                    PRODUTOS_ID_GRUPOS between ${grupoinicial} and ${grupofinal} and
                    ${sqlWhere}
                    PRODUTOS_NOME <> ''
              order by PRODUTOS_ID_GRUPOS, PRODUTOS_NOME`

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                }
            });
        });
    }
};
