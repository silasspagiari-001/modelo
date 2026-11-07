'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, inicio, final, produtoinicial, produtofinal, grupoinicial, grupofinal, pessoa, codprofissio, nomeprofissio, documento, ordem} = params;
            const db = await samosFB.conectarBanco(params.client);

            let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
            let parProdutofinal  = (produtofinal > 0 ? produtofinal : 999999);
            let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
            let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);
            let parPessoa      = (pessoa > 0 ? pessoa : '');
            let parUsuario     = (codprofissio > 0 ? codprofissio : '');
            let idDocumento = documento == 2 ? 2 : parseInt(documento) + 2;                                

            let sqlWhere = '';
            let sqlSearch = '';
            let SqlOrder  = '';

            sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} `;
            sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    

            if(ordem == 1) {
                SqlOrder = `ORDER BY GRUPOS_ID, MOVIMENTOS_VENDIDO descending;`
            } else {
                SqlOrder = `ORDER BY GRUPOS_ID, MOVIMENTOS_VALORVENDA descending;`
            }

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if(parPessoa) {
                sqlWhere += ` and PRODUTOS_ID_PESSOAS = ${parPessoa} `;
            }

            if(parUsuario) {
                sqlWhere += ` and MOVIMENTOS_PROTOCOLO = '${parUsuario}' `;
            }

            if(params.log.toUpperCase().match(/MOVEIS/)) {
                sqlSearch = `SELECT GRUPOS_ID, GRUPOS_NOME, PRODUTOS_ID, PRODUTOS_NOME, PRODUTOS_FABRICA, PRODUTOS_MARCA, SALDOS_PRECO,
                        sum(MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_VENDIDO,
                        sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as MOVIMENTOS_VALORCUSTO,
                        sum(MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_DESPESAS - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_VALORVENDA,
                        sum(MOVIMENTOSITENS_FRETE) as MOVIMENTOS_VALORFRETE,
                        sum(MOVIMENTOSITENS_DESPESAS) as MOVIMENTOS_VALORDESPESAS
                FROM MOVIMENTOSITENS                                    
                left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join SALDOS on SALDOS_ID_PRODUTOS = PRODUTOS_ID and SALDOS_ID_EMPRESAS = 1
                left outer join GRUPOS   on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                where ((MOVIMENTOS_STATUS <> 'C') and 
                       (MOVIMENTOS_STATUS <> 'D') and 
                       (MOVIMENTOS_STATUS <> 'R') and
                       (MOVIMENTOS_STATUS <> 'V')) and
                MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento}) and
                MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                ${sqlWhere}
                GROUP BY GRUPOS_ID, GRUPOS_NOME, PRODUTOS_NOME, PRODUTOS_ID, PRODUTOS_FABRICA, PRODUTOS_MARCA, SALDOS_PRECO`;
            } else {
                sqlSearch = `SELECT GRUPOS_ID, GRUPOS_NOME, PRODUTOS_ID, PRODUTOS_NOME, PRODUTOS_FABRICA, PRODUTOS_MARCA, SALDOS_DISPONIVEL,
                        sum(MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_VENDIDO,
                        sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as MOVIMENTOS_VALORCUSTO,
                        sum(MOVIMENTOSITENS_QUANTIDADE * iif(MOVIMENTOSITENS_IMEDIATA > 0, MOVIMENTOSITENS_IMEDIATA, SALDOS_COMPRA)) as MOVIMENTOS_VALORCOMPRA,
                        sum(MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_DESPESAS - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_VALORVENDA,
                        sum(MOVIMENTOSITENS_FRETE) as MOVIMENTOS_VALORFRETE,
                        sum(MOVIMENTOSITENS_DESPESAS) as MOVIMENTOS_VALORDESPESAS,
                        sum(MOVIMENTOSITENS_VALORST) as MOVIMENTOS_VALORST
                FROM MOVIMENTOSITENS                                    
                left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join GRUPOS   on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                where ((MOVIMENTOS_STATUS <> 'C') and 
                       (MOVIMENTOS_STATUS <> 'D') and
                       (MOVIMENTOS_STATUS <> 'R') and
                       (MOVIMENTOS_STATUS <> 'V')) and
                MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento}) and
                MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                ${sqlWhere}
                GROUP BY GRUPOS_ID, GRUPOS_NOME, PRODUTOS_NOME, PRODUTOS_ID, PRODUTOS_FABRICA, PRODUTOS_MARCA, SALDOS_DISPONIVEL
                ${SqlOrder}`;
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
