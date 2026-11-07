'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');

module.exports = {
    create: (dataList, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const pessoa = dataList.pessoa;
            const dataemissao = dataList.emissao;
            const valor = dataList.valor;
            const operacao = dataList.tipo === 'E' ? ' - ' : ' + ';
            const lancto = dataList.tipo === 'E' ? 'S' : 'E';
            const log = dataList.log;   
            const empresa = dataList.empresa;
            const numero = dataList.numero;
            const serie = dataList.serie;
            // busca a pessoa para fazer a atualização
            const sqlPessoa = `update PESSOAS set PESSOAS_CREDITO = (PESSOAS_CREDITO ${operacao} ${valor})
                                where PESSOAS_ID = ${pessoa}`

            const lastId = await samosFB.lastId(db, 'CREDITOS', 'GEN_CREDITOS_ID', 'CREDITOS_ID');

            const sqlCredito = `insert into CREDITOS (CREDITOS_ID,
                                                        CREDITOS_ID_PESSOAS,
                                                        CREDITOS_EMISSAO,
                                                        CREDITOS_STATUS,
                                                        CREDITOS_TIPO,
                                                        CREDITOS_NOME,
                                                        CREDITOS_VALOR,
                                                        CREDITOS_LOG,
                                                        CREDITOS_ID_MOVIMENTOS) values 
                                                        (${lastId},
                                                        ${pessoa},
                                                        '${dataemissao}',
                                                        'C',
                                                        '${lancto}',
                                                        'Loja ${empresa} - ${numero} ${serie} - Abatimento',
                                                        ${valor},
                                                        '${log}',
                                                        0)`;
                
            db.query(sqlPessoa, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao atualizar pessoa`, db, error, reject, sqlPessoa);
                } else {
                    db.query(sqlCredito, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao atualizar credito`, db, error, reject, sqlCredito)
                        } else {
                            samosFB.processarGravacao({db, results: dataList, resolve, reject})
                        }
                    });
                }
            });
        });
    }
}
