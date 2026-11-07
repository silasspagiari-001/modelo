'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
                const { empresa, inicio, final, produtoinicial, produtofinal, grupoinicial, grupofinal, usuarioinicial, usuariofinal, pessoa, documento} = params;
                const db = await samosFB.conectarBanco(params.client);

                let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
                let parProdutofinal  = (produtofinal > 0 ? produtofinal : 999999);
                let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
                let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);
                let parUsuarioinicial = (usuarioinicial > 0 ? usuarioinicial : 1);
                let parUsuariofinal  = (usuariofinal > 0 ? usuariofinal : 999999);

                let parPessoa      = (pessoa > 0 ? pessoa : '');

                let sqlWhere = '';
                let sqlSearch = '';
                let idDocumento = parseInt(documento) + 2;

                sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} `;
                sqlWhere += `and MOVIMENTOS_ID_USUARIOS between ${parUsuarioinicial} and ${parUsuariofinal} `;
                sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    

                if(parPessoa) {
                     sqlWhere += ` and PRODUTOS_ID_PESSOAS = ${parPessoa} `;
                }

                if(empresa > 0) {
                   sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
                }

                if(params.empresacnpj == '07022329000100' && idDocumento == 3) {  // Turbotec prudente (por enquanto pegar pelo CNPJ)
                        sqlWhere += ` and MOVIMENTOS_ID_PESSOAS <> 2006 and MOVIMENTOS_ID_PESSOAS <> 900131
                                      and MOVIMENTOS_ID_PESSOAS <> 900152 and MOVIMENTOS_ID_PESSOAS <> 3077 `;
                }
                sqlSearch = `SELECT GRUPOS_ID, GRUPOS_NOME,
                        sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                                and ((MOVIMENTOS_STATUS <> 'C') and 
                                     (MOVIMENTOS_STATUS <> 'D') and
                                     (MOVIMENTOS_STATUS <> 'R') and
                                     (MOVIMENTOS_STATUS <> 'V'))
                                and OPERACOES_ACAO = 'VN'
                                THEN MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOS_VENDIDO,

                        sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                                and ((MOVIMENTOS_STATUS <> 'C') and 
                                     (MOVIMENTOS_STATUS <> 'D') and
                                     (MOVIMENTOS_STATUS <> 'R') and
                                     (MOVIMENTOS_STATUS <> 'V'))
                                and OPERACOES_ACAO = 'VN'                                                                
                                THEN (MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) ELSE 0 END) MOVIMENTOS_VALORCUSTO,

                        sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                                and ((MOVIMENTOS_STATUS <> 'C') and 
                                     (MOVIMENTOS_STATUS <> 'D') and
                                     (MOVIMENTOS_STATUS <> 'R') and
                                     (MOVIMENTOS_STATUS <> 'V'))
                                and OPERACOES_ACAO = 'VN'                                                                
                                THEN (MOVIMENTOSITENS_QUANTIDADE * SALDOS_PRECO) ELSE 0 END) MOVIMENTOS_PRECOVENDA,

                        sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                                and ((MOVIMENTOS_STATUS <> 'C') and 
                                     (MOVIMENTOS_STATUS <> 'D') and
                                     (MOVIMENTOS_STATUS <> 'R') and
                                     (MOVIMENTOS_STATUS <> 'V'))
                                and OPERACOES_ACAO = 'VN'                                                                
                                THEN (MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_DESPESAS - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_VALORVENDA,

                        sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                                and ((MOVIMENTOS_STATUS <> 'C') and 
                                     (MOVIMENTOS_STATUS <> 'D') and
                                     (MOVIMENTOS_STATUS <> 'R') and
                                     (MOVIMENTOS_STATUS <> 'V'))
                                and OPERACOES_ACAO = 'VN'                                                                
                                THEN MOVIMENTOSITENS_FRETE ELSE 0 END) MOVIMENTOS_VALORFRETE,

                        sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                                and ((MOVIMENTOS_STATUS <> 'C') and 
                                     (MOVIMENTOS_STATUS <> 'D') and
                                     (MOVIMENTOS_STATUS <> 'R') and
                                     (MOVIMENTOS_STATUS <> 'V'))
                                and OPERACOES_ACAO = 'VN'                                                                
                                THEN MOVIMENTOSITENS_DESPESAS ELSE 0 END) MOVIMENTOS_VALORDESPESAS,

                        sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})
                                and ((MOVIMENTOS_STATUS <> 'C') and 
                                     (MOVIMENTOS_STATUS <> 'D') and
                                     (MOVIMENTOS_STATUS <> 'R') and
                                     (MOVIMENTOS_STATUS <> 'V'))
                                and OPERACOES_ACAO = 'VN'                                                                
                                THEN MOVIMENTOSITENS_VALORST ELSE 0 END) MOVIMENTOS_VALORST
                                
                from MOVIMENTOSITENS                                    
                left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join GRUPOS   on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                left outer join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                ${sqlWhere}
                group by GRUPOS_ID, GRUPOS_NOME
                order by GRUPOS_ID, GRUPOS_NOME`
                                
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
