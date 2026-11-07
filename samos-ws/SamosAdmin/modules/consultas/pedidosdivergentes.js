'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { excecao, meses, incluiHoje } = params;

            //excecao   : o id da nota que está na tela, que não entra na verificacao
            //meses     : numero de meses para trás a verificar
            //incluiHoje: se T, verifica notas pendentes de hoje tambem

            const desde = moment.tz(params.timezone).subtract(meses, 'months').format('YYYY-MM-DD');
            
            const sql = `select 
                MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE,
                MOVIMENTOS_EMISSAO,
                (
                    MOVIMENTOSCAIXA_DINHEIRO + 
                    MOVIMENTOSCAIXA_CHEQUE + 
                    MOVIMENTOSCAIXA_CREDITO + 
                    MOVIMENTOSCAIXA_DEBITO + 
                    MOVIMENTOSCAIXA_DUPLICATA + 
                    MOVIMENTOSCAIXA_TRANSFERENCIAS + 
                    MOVIMENTOSCAIXA_OUTRO + 
                    MOVIMENTOSCAIXA_COMBUSTIVEL + 
                    MOVIMENTOSCAIXA_PRESENTE + 
                    MOVIMENTOSCAIXA_REFEICAO + 
                    MOVIMENTOSCAIXA_ALIMENTACAO + 
                    MOVIMENTOSCAIXA_CREDITOPESSOA + 
                    MOVIMENTOSCAIXA_CREDITOLOJA
                ) as TOTALCAIXA,
                MOVIMENTOS_TOTAL

            from MOVIMENTOS
            join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
            join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
            where 
                MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} and
                right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0002' and
                MOVIMENTOS_EMISSAO >= '${desde}' and
                MOVIMENTOS_STATUS <> 'C' and
                MOVIMENTOS_SERIEORIGEM <> 'NE' and
                OPERACOES_FINANCEIRO <> 'N'
                ${excecao ? ` and MOVIMENTOS_ID <> ${excecao} ` : ''}
                ${incluiHoje == 'T' ? '' : ` and MOVIMENTOS_EMISSAO < current_date `}`;
             
            const resultsSql = await samosFB.executeSQL(sql, params);
            const resultsNode = [];

            //Procura os divergentes
            for( let i = 0 ; i < resultsSql.length ; i++ ) {
                if( resultsSql[i]['MOVIMENTOS_TOTAL'] != resultsSql[i]['TOTALCAIXA'] ) {
                    resultsNode.push( resultsSql[i] );
                }
            }

            return { 
                results: resultsNode
            };
            
        } catch(error) {
            const msg = 'Falha ao verificar pedidos divergentes';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
