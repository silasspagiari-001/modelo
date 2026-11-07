'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, pessoa, inicio, final, status, ramo } = params;
            const db = await samosFB.conectarBanco(params.client);
            let sqlWhere = '';
            let sqlSearch = '';

            if(ramo == 'moveis') {
                if(status == 0) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'N' `;  // Entregar
                } else if(status == 1) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'E' `;  // Executado
                } else if(status == 2) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'F' `;   // Faturado
                }    
            } else {  // construção
                if(status == 0) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'J' `;  // Imediata Entregue
                } else if(status == 1) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'I' `;  // Imediata a entregar
                } else if(status == 2) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'E' `;   // Normal Entregue
                } else if(status == 3) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'N' `;   // Normal a entregar
                }    
            }

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if(pessoa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = ${pessoa} `;
            }

            if(ramo == 'moveis') {  // Somente romaneios de entrega
                sqlSearch = `select ROMANEIOSITENS_ID, ROMANEIOSITENS_ID_MOVIMENTOS, MOVIMENTOS_IMPOSTO, PESSOAS_ID, PESSOAS_FORMULA, ROMANEIOS_EMISSAO, ROMANEIOS_NUMERO, ROMANEIOS_FRETE, ROMANEIOS_TOTAL, ROMANEIOS_SERIE, ROMANEIOS_ID_EMPRESAS, ROMANEIOS_LOCAL, ROMANEIOSITENS_ID_ITEM, DOCUMENTOS_NOME
                            from ROMANEIOSITENS
                                left outer join MOVIMENTOS on MOVIMENTOS_ID = ROMANEIOSITENS_ID_MOVIMENTOS
                                left outer join ROMANEIOS on ROMANEIOS_ID = ROMANEIOSITENS_ID_ROMANEIOS
                                left outer join PESSOAS on PESSOAS_ID = ROMANEIOS_ID_PESSOAS                                
                                left outer join DOCUMENTOS on DOCUMENTOS_ID = ROMANEIOS_ID_DOCUMENTOS
                where ROMANEIOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                  and right(lpad(ROMANEIOS_ID_DOCUMENTOS, 6, 0), 4) = '0010'
                  and ROMANEIOS_STATUS <> 'R'
                ${sqlWhere}
                order by MOVIMENTOS_ID_PESSOAS, ROMANEIOS_EMISSAO`
            } else {
                sqlSearch = `select ROMANEIOS_ID_EMPRESAS, ROMANEIOS_NUMERO, ROMANEIOS_SERIE, ROMANEIOS_EMISSAO, MOVIMENTOS_ID_USUARIOS, USUARIOS_LOGIN,
                            MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO,
                            MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_NOME, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME,
                            PRODUTOS_UNIDADE, ROMANEIOSITENS.*
                            from ROMANEIOS
                                left outer join MOVIMENTOS on MOVIMENTOS_ID = ROMANEIOS_ID_MOVIMENTOS
                                left outer join ROMANEIOSITENS on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                                left outer join MOVIMENTOSITENS on MOVIMENTOSITENS_ID = ROMANEIOSITENS_ID_ITEM
                                left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where ROMANEIOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                ${sqlWhere}
                order by MOVIMENTOS_ID_PESSOAS, ROMANEIOS_EMISSAO`
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
