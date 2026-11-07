'use strict';

const samosFB = require('../services/samosFirebird');
const utils   = require('../services/samosUtils');

module.exports = {

    create: (dataList, params) => {
        return new Promise(async (resolve, reject) => {     
            const db     = await samosFB.conectarBanco(params.client);
            const lastId = await samosFB.lastId(db, 'CONTROLES', 'GEN_CONTROLES_ID', 'CONTROLES_ID'); 

            let data = {
                'CONTROLES_ID': lastId,
                'CONTROLES_STATUS': 'T',
                'CONTROLES_ID_PORTADORES': dataList.portador,
                'CONTROLES_ID_APLICACOES': 1,
                'CONTROLES_EMISSAO': dataList.emissao,
                'CONTROLES_VENCIMENTO': dataList.vencimento,
                'CONTROLES_COMPENSADO': dataList.compensado,
                'CONTROLES_NOME': dataList.nomecheque,
                'CONTROLES_DOCUMENTO': dataList.numerocheque,
                'CONTROLES_TIPO': 'E',
                'CONTROLES_VALOR': dataList.valorcheque,
                'CONTROLES_LOG': dataList.log,
                'CONTROLES_ID_MOVIMENTOS': 0
            }

            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into CONTROLES (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: data, resolve, reject});
                }
            });
        });        
    }
};