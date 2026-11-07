'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, documento, nomedocumento, numero, pessoa, movimentosnome, inicio, final, ordem, status, situacao, start, limit } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';
            let sqlEmpresa       = empresa       ? `and MOVIMENTOS_ID_EMPRESAS   = '${empresa}'       ` : '';
            let sqlDocumento     = documento     ? `and MOVIMENTOS_ID_DOCUMENTOS = '${documento}'     ` : '';
            let sqlNomeDocumento = nomedocumento ? `and DOCUMENTOS_NOME          = '${nomedocumento}' ` : '';
            let sqlWhere = `where MOVIMENTOS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlNomeDocumento} `;

            if(pessoa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = '${pessoa}' `; 
            } else if(movimentosnome) {
                sqlWhere += ` and MOVIMENTOS_NOME like '${movimentosnome}%' `; 
            }
            
            if (inicio && final && inicio.length > 0 && final.length > 0) {
                if (ordem == 3) { // Entrada/Saida
                    sqlWhere += ` and MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                } else {
                    sqlWhere += ` and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }
            }

            if(ordem == 0) {
                sqlOrder = ` order by MOVIMENTOS_EMISSAO, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
            } else if (ordem == 1) {
                sqlOrder = ` order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID`;
            } else if (ordem == 2) {
                sqlOrder = ` order by MOVIMENTOS_NUMERO `;
            } else if (ordem == 3) {
                sqlOrder = ` order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
            } else if (ordem == 4) {
                sqlOrder = ` order by MOVIMENTOS_ID_OPERACOES, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
            }  

            if(parseInt(situacao) >= 0) {
                sqlWhere += ` and MOVIMENTOS_SITUACAO = '${situacao}' `;
            }

            if(status != 'T') {
                if(status == 'E') {
                    sqlWhere += ` and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D' and MOVIMENTOS_STATUS <> 'R' `; 
                } else if(status == 'C' || status == 'D' || status == 'R') {
                    sqlWhere += ` and MOVIMENTOS_STATUS = '${status}' `; 
                }
            }
                                  
            const sqlSearch = `
                select ${limits} 
                    MOVIMENTOS_ID, 
                    MOVIMENTOS_ID_EMPRESAS, 
                    MOVIMENTOS_ID_PESSOAS, 
                    MOVIMENTOS_ID_DOCUMENTOS,
                    MOVIMENTOS_NUMERO,
                    MOVIMENTOS_SERIE,
                    MOVIMENTOS_NUMEROORIGEM,
                    MOVIMENTOS_SERIEORIGEM,
                    MOVIMENTOS_ID_OPERACOES,
                    OPERACOES_ACAO,
                    MOVIMENTOS_STATUS,
                    MOVIMENTOS_SITUACAO,
                    MOVIMENTOS_EMISSAO,
                    MOVIMENTOS_ENTRADASAIDA,
                    USUARIOS_LOGIN,
                    MOVIMENTOS_NOME,
                    MOVIMENTOS_CPFCNPJ,
                    MOVIMENTOS_TOTAL,
                    MOVIMENTOS_BASEICMS,
                    MOVIMENTOS_VALORICMS,
                    MOVIMENTOS_BASEST,
                    MOVIMENTOS_VALORST,
                    MOVIMENTOS_VALORIPI,
                    MOVIMENTOS_FRETE,
                    MOVIMENTOS_SEGURO,
                    MOVIMENTOS_DESPESAS,
                    MOVIMENTOS_DESCONTOS,
                    MOVIMENTOS_PRODUTOS,
                    MOVIMENTOS_NFE,
                    MOVIMENTOS_PROTOCOLO,
                    EMPRESAS_FANTASIA,
                    EMPRESAS_NOME,
                    DOCUMENTOS_NOME,
                    PRAZOS_NOME
                from MOVIMENTOS 
                    left join USUARIOS        on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                    join DOCUMENTOS           on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                    join EMPRESAS             on EMPRESAS_ID   = MOVIMENTOS_ID_EMPRESAS
                    left join OPERACOES       on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
                    left outer join PRAZOS    on PRAZOS_ID     = MOVIMENTOS_ID_PRAZOS
                ${sqlWhere} ${sqlOrder}`; 

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, resolve, reject});
                }
            });
        });
    }
};