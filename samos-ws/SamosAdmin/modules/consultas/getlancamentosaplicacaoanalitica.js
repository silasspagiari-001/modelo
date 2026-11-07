'use strict';

const utils   = require('../../services/samosUtils');
const samosFB = require('../../services/samosFB');
const api     = require('..');

module.exports = {
    read: async params => {
        try {
            const { id, mascara } = params;

            const sqlSearchMovimentos = `select MOVIMENTOS_ID, MOVIMENTOS_ID_APLICACOES from MOVIMENTOS
                                         where MOVIMENTOS_ID_APLICACOES = ${id} `;

            const sqlSearchFinanceiros = `select FINANCEIROS_ID, FINANCEIROS_ID_APLICACOES from FINANCEIROS
                                          where FINANCEIROS_ID_APLICACOES = ${id} `;

            const sqlSearchContaCorrentes = `select CONTACORRENTES_ID, CONTACORRENTES_ID_APLICACOES
                                           from CONTACORRENTES
                                           where CONTACORRENTES_ID_APLICACOES = ${id} `;

            const sqlSearchMovimentosCaixa = `select MOVIMENTOSCAIXA_ID, MOVIMENTOSCAIXA_ID_APLICACOES
                                              from MOVIMENTOSCAIXA
                                              where MOVIMENTOSCAIXA_ID_APLICACOES = ${id}
                                              `;

            const sqlSearchControles = `select CONTROLES_ID, CONTROLES_ID_APLICACOES
                                        from CONTROLES
                                        where CONTROLES_ID_APLICACOES = ${id} `

            const sqlSearchDocumentos = `select DOCUMENTOS_ID, DOCUMENTOS_ID_APLICACOES
                                        from DOCUMENTOS
                                        where DOCUMENTOS_ID_APLICACOES = ${id} `

            const search = {
                movimentos: await samosFB.executeSQL(sqlSearchMovimentos, params),
                financeiros: await samosFB.executeSQL(sqlSearchFinanceiros, params),
                contacorrentes: await samosFB.executeSQL(sqlSearchContaCorrentes, params),
                movimentoscaixa: await samosFB.executeSQL(sqlSearchMovimentosCaixa, params),
                controles: await samosFB.executeSQL(sqlSearchControles, params),
                documentos: await samosFB.executeSQL(sqlSearchDocumentos, params)
            };

            const temLancamento = search.movimentos.length > 0 ||
                                  search.financeiros.length > 0 || 
                                  search.contacorrentes.length > 0 || 
                                  search.movimentoscaixa.length > 0 ||
                                  search.controles.length > 0 ||
                                  search.documentos.length > 0;

            return { 
                temLancamento: temLancamento
            };

        } catch(error) {
            const msg = 'Falha ao consultar filhos da aplicação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};