'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { tipo, empresa, aplicacao, inicio, final} = params;
            const db = await samosFB.conectarBanco(params.client);
            let sqlWhere = '';
            let sqlSearch = '';

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOSCAIXA_ID_EMPRESAS = ${empresa} `;
            }

            if(aplicacao > 0) {
                sqlWhere += ` and MOVIMENTOSCAIXA_ID_APLICACOES = ${aplicacao} `;
            }

            if(tipo == 0) {  // Analítico
                sqlSearch = `select MOVIMENTOSCAIXA_EMISSAO, MOVIMENTOSCAIXA_ID_APLICACOES, APLICACOES_NOME, MOVIMENTOSCAIXA_NOME, EMPRESAS_NOME,
                            case when MOVIMENTOSCAIXA_TIPO = 'E'
                                    then (MOVIMENTOSCAIXA_DINHEIRO - MOVIMENTOSCAIXA_TROCO + MOVIMENTOSCAIXA_CHEQUE +
                                        MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_CREDITOLOJA +
                                        MOVIMENTOSCAIXA_ALIMENTACAO + MOVIMENTOSCAIXA_REFEICAO + MOVIMENTOSCAIXA_PRESENTE +
                                        MOVIMENTOSCAIXA_COMBUSTIVEL + MOVIMENTOSCAIXA_DUPLICATA + MOVIMENTOSCAIXA_BOLETO +
                                        MOVIMENTOSCAIXA_OUTRO) ELSE 0 END MOVIMENTOSCAIXA_ENTRADAS,
        
                            case when MOVIMENTOSCAIXA_TIPO = 'S'
                                    then (MOVIMENTOSCAIXA_DINHEIRO - MOVIMENTOSCAIXA_TROCO + MOVIMENTOSCAIXA_CHEQUE +
                                            MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_CREDITOLOJA +
                                            MOVIMENTOSCAIXA_ALIMENTACAO + MOVIMENTOSCAIXA_REFEICAO + MOVIMENTOSCAIXA_PRESENTE +
                                            MOVIMENTOSCAIXA_COMBUSTIVEL + MOVIMENTOSCAIXA_DUPLICATA + MOVIMENTOSCAIXA_BOLETO +
                                            MOVIMENTOSCAIXA_OUTRO) ELSE 0 END MOVIMENTOSCAIXA_SAIDAS
                            FROM MOVIMENTOSCAIXA
                            left outer join APLICACOES on APLICACOES_ID = MOVIMENTOSCAIXA_ID_APLICACOES
                            left outer join EMPRESAS on EMPRESAS_ID = MOVIMENTOSCAIXA_ID_EMPRESAS
                            where MOVIMENTOSCAIXA_ID_APLICACOES > 1 and MOVIMENTOSCAIXA_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                            ${sqlWhere}
                            order by MOVIMENTOSCAIXA_ID_APLICACOES, MOVIMENTOSCAIXA_EMISSAO`
            } else {  // Sintético
                sqlSearch = `select MOVIMENTOSCAIXA_ID_APLICACOES, APLICACOES_NOME,
                            sum(case when MOVIMENTOSCAIXA_TIPO = 'E'
                                    then (MOVIMENTOSCAIXA_DINHEIRO - MOVIMENTOSCAIXA_TROCO + MOVIMENTOSCAIXA_CHEQUE +
                                        MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_CREDITOLOJA +
                                        MOVIMENTOSCAIXA_ALIMENTACAO + MOVIMENTOSCAIXA_REFEICAO + MOVIMENTOSCAIXA_PRESENTE +
                                        MOVIMENTOSCAIXA_COMBUSTIVEL + MOVIMENTOSCAIXA_DUPLICATA + MOVIMENTOSCAIXA_BOLETO +
                                        MOVIMENTOSCAIXA_OUTRO) ELSE 0 END) MOVIMENTOSCAIXA_ENTRADAS,
        
                            sum(case when MOVIMENTOSCAIXA_TIPO = 'S'
                                        then (MOVIMENTOSCAIXA_DINHEIRO - MOVIMENTOSCAIXA_TROCO + MOVIMENTOSCAIXA_CHEQUE +
                                                MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_CREDITOLOJA +
                                                MOVIMENTOSCAIXA_ALIMENTACAO + MOVIMENTOSCAIXA_REFEICAO + MOVIMENTOSCAIXA_PRESENTE +
                                                MOVIMENTOSCAIXA_COMBUSTIVEL + MOVIMENTOSCAIXA_DUPLICATA + MOVIMENTOSCAIXA_BOLETO +
                                                MOVIMENTOSCAIXA_OUTRO) ELSE 0 END) MOVIMENTOSCAIXA_SAIDAS
                            FROM MOVIMENTOSCAIXA
                            left outer join APLICACOES ON APLICACOES_ID = MOVIMENTOSCAIXA_ID_APLICACOES
                            where MOVIMENTOSCAIXA_ID_APLICACOES > 0 and MOVIMENTOSCAIXA_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                            ${sqlWhere}
                            group by MOVIMENTOSCAIXA_ID_APLICACOES, APLICACOES_NOME`
            }

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
