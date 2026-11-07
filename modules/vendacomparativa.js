'use strict';

const samosFB = require('../services/samosFirebird');
const utils   = require('../services/samosUtils');
const cents   = utils.number.cents.bind(utils.number);


module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, tipo, inicio, final, pessoainicial, pessoafinal, grupoinicial, grupofinal, ordem, cidade, produto} = params;
            const db = await samosFB.conectarBanco(params.client);

            //tipo: 0 - Pessoas /  1 - Produtos

            let parPessoainicial = (pessoainicial > 0 ? pessoainicial : 1);
            let parPessoafinal  = (pessoafinal > 0 ? pessoafinal : 999999);
            let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
            let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);

            let sqlWhere = '';
            let sqlSearch = '';
            let sqlOrder = '';

            if(tipo == 0) { // Pessoas
                if(ordem == 0) {
                    sqlOrder = `order by PESSOAS_NOME`
                } else {
                    sqlOrder = `order by sum(MOVIMENTOSITENS_TOTAL) descending`
                }                 
            } else { // Produtos
                if(ordem == 0) {
                    sqlOrder = `order by PRODUTOS_NOME`
                } else {
                    sqlOrder = `order by sum(MOVIMENTOSITENS_TOTAL) descending`
                }                 
            }

            if(cents(produto) > 0) {
                sqlWhere += `and PRODUTOS_ID = ${produto} `;
            }
 
            sqlWhere += `and MOVIMENTOS_ID_PESSOAS between ${parPessoainicial} and ${parPessoafinal} `;
            sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if(cidade > 0) {
                sqlWhere += ` and PESSOAS_ID_CIDADES = ${cidade} `;
            }

            if(tipo == 0) { // Pessoas
                sqlSearch = `SELECT MOVIMENTOS_ID_PESSOAS, PESSOAS_NOME, PESSOAS_FANTASIA, CIDADES_NOME, CIDADES_ESTADO, USUARIOS_NOME, extract(year from MOVIMENTOS_EMISSAO) as MOVIMENTOS_ANO,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 1
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES01,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 2
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES02,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 3
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES03,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 4
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES04,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 5
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES05,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 6
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES06,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 7
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES07,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 8
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES08,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 9
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES09,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 10
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES10,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 11
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES11,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 12
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES12,
                                sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_TOTALPESSOA
                            FROM MOVIMENTOSITENS
                            left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                            left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES                            
                            left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                            left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                            left outer join USUARIOS on USUARIOS_ID = PESSOAS_ID_USUARIOS
                            left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                            where ((MOVIMENTOS_STATUS <> 'C') and 
                                (MOVIMENTOS_STATUS <> 'D') and
                                (MOVIMENTOS_STATUS <> 'R') and
                                (MOVIMENTOS_STATUS <> 'V')) and
                                 OPERACOES_ACAO = 'VN' and
                            MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                            ${sqlWhere}
                            group by PESSOAS_NOME, MOVIMENTOS_ID_PESSOAS, PESSOAS_FANTASIA, CIDADES_NOME, CIDADES_ESTADO, USUARIOS_NOME, MOVIMENTOS_ANO
                            ${sqlOrder}`
            } else { // Produtos
                sqlSearch = `SELECT MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, extract(year from MOVIMENTOS_EMISSAO) as MOVIMENTOS_ANO,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 1
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES01,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 2
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES02,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 3
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES03,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 4
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES04,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 5
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES05,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 6
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES06,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 7
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES07,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 8
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES08,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 9
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES09,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 10
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES10,
                                        sum(case when extract(month from MOVIMENTOS_EMISSAO) = 11
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES11,
                                sum(case when extract(month from MOVIMENTOS_EMISSAO) = 12
                                        then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES12,
                                sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_TOTALPRODUTO
                            from MOVIMENTOSITENS
                            left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                            left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                            left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                            left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                            left outer join USUARIOS on USUARIOS_ID = PESSOAS_ID_USUARIOS
                            left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                            where ((MOVIMENTOS_STATUS <> 'C') and 
                                (MOVIMENTOS_STATUS <> 'D') and
                                (MOVIMENTOS_STATUS <> 'R') and
                                (MOVIMENTOS_STATUS <> 'V')) and
                                 OPERACOES_ACAO = 'VN' and
                            MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                            ${sqlWhere}
                            group by PRODUTOS_NOME, MOVIMENTOSITENS_ID_PRODUTOS, MOVIMENTOS_ANO
                            ${sqlOrder}`
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
