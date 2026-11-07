'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    create: (dataList, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const portador = dataList.portador || 0;
            const aplicacao = dataList.aplicacao || 0;
            const status = dataList.status || 'T';
            const dataemissao = dataList.emissao;
            const datavencimento = dataList.vencimento;            
            const valor = dataList.valor;
            const tipo = dataList.tipo; // E ou S
            const nome = dataList.nome;
            const documento = dataList.documento;
            const log = dataList.log;   

            const lastId = await samosFB.lastId(db, 'CONTROLES', 'GEN_CONTROLES_ID', 'CONTROLES_ID');

            const sqlDeposito = `insert into CONTROLES (
                CONTROLES_ID,
                CONTROLES_STATUS,
                CONTROLES_ID_PORTADORES,
                CONTROLES_ID_APLICACOES,                                                        
                CONTROLES_EMISSAO,
                CONTROLES_VENCIMENTO,
                CONTROLES_COMPENSADO,
                CONTROLES_NOME,
                CONTROLES_DOCUMENTO,
                CONTROLES_TIPO,
                CONTROLES_VALOR,
                CONTROLES_LOG
            ) values (
                ${lastId},
                '${status}',
                ${portador},
                ${aplicacao},
                '${dataemissao}',
                '${datavencimento}',
                '1899-12-30',
                '${nome}',
                '${documento}',
                '${tipo}',
                ${valor},
                '${log}'
            )`;
                                                                        
            db.query(sqlDeposito, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao lançar depósito em conta`, db, error, reject, sqlDeposito)
                } else {
                    samosFB.processarGravacao({db, results: dataList, resolve, reject}) // ver aqui testando dataList ao invés de data
                }
            });
        });
    },

    lote : {
        update: (dataList, params) => {
            return new Promise(async (resolve, reject) => {
                const db = await samosFB.conectarBanco(params.client);

                const sqlDocumento = dataList.documento ? `CONTROLES_DOCUMENTOS = ${dataList.iddocumento},` : '';
   
                const sqlSearch = `update CONTROLES set CONTROLES_ID_PORTADORES = ${dataList.idportador},
                                                        ${sqlDocumento}
                                                        CONTROLES_LOG = '${dataList.log}'
                                                    where CONTROLES_ID_MOVIMENTOS = ${dataList.idmovimento}`;
  
                db.query(sqlSearch, (error, results) => {
                    if (error) {
                        samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                    } else {
                        samosFB.processarGravacao({db, results: dataList, resolve, reject});
                    }
                });
            });
        }    
    }
}
