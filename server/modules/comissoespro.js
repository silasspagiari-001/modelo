'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, vendedor, inicio, final} = params;
            let sqlWhere = '';
            let sqlSearch = '';
            let sqlOrder = '';

            if(params.log.match(/prudenmoveis/)) {
                sqlOrder = 'order by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_NUMERO, PRODUTOS_NOME'
            } else {
                sqlOrder = 'order by MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_NUMERO, PRODUTOS_NOME'
            }

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if(vendedor > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
            }

            if(params.log.match(/prudenmoveis/)) {
                    sqlSearch = `SELECT MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_DOCUMENTOS, MOVIMENTOS_NUMERO,
                    MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_MARCA, PRODUTOS_APLICACAO, MOVIMENTOSITENS_QUANTIDADE,
                    (MOVIMENTOSITENS_CUSTO * MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_CUSTO,
                    (MOVIMENTOSITENS_VALORPISST * MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOSITENS_PRECOMINIMO,
                    MOVIMENTOSITENS_IMPOSTO as MOVIMENTOSITENS_PARTIDA,
                    round(((MOVIMENTOSITENS_IMPOSTO / 100) * SALDOS_COMISSAO), 2) as MOVIMENTOSITENS_COMISSAO
                FROM MOVIMENTOSITENS                                    
                    left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                    left outer join PRODUTOS ON PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                    left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                    left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                    where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                    and ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
                         (right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0012')) and MOVIMENTOS_STATUS <> 'C'
                    ${sqlWhere} ${sqlOrder}`
            } else {
                    sqlSearch = `SELECT MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_DOCUMENTOS, MOVIMENTOS_NUMERO,
                    MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_MARCA, PRODUTOS_APLICACAO, PRODUTOS_ID_GRUPOS,
                    MOVIMENTOSITENS_QUANTIDADE, (SALDOS_PRECOMINIMO * MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_CUSTO,
                    round(((MOVIMENTOS_IMPOSTO / MOVIMENTOS_TOTAL) * (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS)), 2) as MOVIMENTOSITENS_PARTIDA,
                    round(((((MOVIMENTOS_IMPOSTO / MOVIMENTOS_TOTAL) * (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS)) / 100) * SALDOS_COMISSAO), 2) as MOVIMENTOSITENS_COMISSAO
                FROM MOVIMENTOSITENS                                    
                    left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                    left outer join PRODUTOS ON PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                    left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                    left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                    where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                    and ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
                         (right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0012')) and MOVIMENTOS_STATUS <> 'C'
                    ${sqlWhere} ${sqlOrder}`
            } 
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar comissões pro';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
