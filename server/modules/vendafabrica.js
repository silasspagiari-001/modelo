'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, inicio, final, produtoinicial, produtofinal, grupoinicial, grupofinal, pessoainicial, pessoafinal, documento} = params;
            const db = await samosFB.conectarBanco(params.client);

            let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
            let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);
            let parPessoainicial = (pessoainicial > 0 ? pessoainicial : '');
            let parPessoafinal = (pessoafinal > 0 ? pessoafinal : pessoainicial);

            let sqlWhere = '';
            let sqlSearch = '';
            let idDocumento = parseInt(documento) + 2;

            sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    

            if(parPessoainicial) {
                sqlWhere += ` and ((PRODUTOS_ID_PESSOAS = ${parPessoainicial}) or ((PRODUTOS_ID_PESSOAS = ${parPessoafinal}))) `;
            }

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            sqlSearch = `SELECT PRODUTOS_ID, PRODUTOS_NOME, PRODUTOS_MARCA,
                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                        and ((MOVIMENTOS_STATUS <> 'C') and 
                             (MOVIMENTOS_STATUS <> 'D') and
                             (MOVIMENTOS_STATUS <> 'R') and
                             (MOVIMENTOS_STATUS <> 'V'))
                        and OPERACOES_FINALIDADE = 'N'
                        THEN MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOS_VENDIDO,

                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                        and ((MOVIMENTOS_STATUS <> 'C') and 
                             (MOVIMENTOS_STATUS <> 'D') and
                             (MOVIMENTOS_STATUS <> 'R') and
                             (MOVIMENTOS_STATUS <> 'V'))
                        and OPERACOES_FINALIDADE = 'N'                                                                
                        THEN (MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) ELSE 0 END) MOVIMENTOS_VALORCUSTO,

                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                        and ((MOVIMENTOS_STATUS <> 'C') and 
                             (MOVIMENTOS_STATUS <> 'D') and
                             (MOVIMENTOS_STATUS <> 'R') and
                             (MOVIMENTOS_STATUS <> 'V'))
                        and OPERACOES_FINALIDADE = 'N'                                                                
                        THEN (MOVIMENTOSITENS_QUANTIDADE * SALDOS_PRECO) ELSE 0 END) MOVIMENTOS_PRECOVENDA,

                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                        and ((MOVIMENTOS_STATUS <> 'C') and 
                             (MOVIMENTOS_STATUS <> 'D') and
                             (MOVIMENTOS_STATUS <> 'R') and
                             (MOVIMENTOS_STATUS <> 'V'))
                        and OPERACOES_FINALIDADE = 'N'                                                                
                        THEN (MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_DESPESAS - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_VALORVENDA,

                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                        and ((MOVIMENTOS_STATUS <> 'C') and 
                             (MOVIMENTOS_STATUS <> 'D') and
                             (MOVIMENTOS_STATUS <> 'R') and
                             (MOVIMENTOS_STATUS <> 'V'))
                        and OPERACOES_FINALIDADE = 'N'                                                                
                        THEN MOVIMENTOSITENS_FRETE ELSE 0 END) MOVIMENTOS_VALORFRETE,

                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                        and ((MOVIMENTOS_STATUS <> 'C') and 
                             (MOVIMENTOS_STATUS <> 'D') and
                             (MOVIMENTOS_STATUS <> 'R') and
                             (MOVIMENTOS_STATUS <> 'V'))
                        and OPERACOES_FINALIDADE = 'N'                                                                
                        THEN MOVIMENTOSITENS_DESPESAS ELSE 0 END) MOVIMENTOS_VALORDESPESAS
                                                                    
            from MOVIMENTOSITENS                                    
            left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
            left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
            left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
            left outer join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
            where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
            ${sqlWhere}
            GROUP BY PRODUTOS_ID, PRODUTOS_NOME, PRODUTOS_MARCA`
                
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
