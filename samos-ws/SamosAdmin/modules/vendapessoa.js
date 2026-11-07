'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
                const { empresa, quebra, operacoes, documento, inicio, final, pesinicio, pesfinal, grpinicio, grpfinal, proinicio, profinal} = params;
                const db = await samosFB.conectarBanco(params.client);

                let parPessoainicial  = (pesinicio > 0 ? pesinicio : 1);
                let parPessoafinal    = (pesfinal  > 0 ? pesfinal  : 999999);
                let parGrupoinicial   = (grpinicio > 0 ? grpinicio : 1);
                let parGrupofinal     = (grpfinal  > 0 ? grpfinal  : 999999);
                let parProdutoinicial = (proinicio > 0 ? proinicio : 1);
                let parProdutofinal   = (profinal  > 0 ? profinal  : 999999);

                let sqlWhere = '';
                let sqlSearch = '';

                sqlWhere += `and MOVIMENTOS_ID_PESSOAS between ${parPessoainicial} and ${parPessoafinal} `;
                sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    
                sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} `;

                if(empresa > 0) {
                   sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
                }
              
                if(params.empresacnpj.match(/05971492000186|32072246000165/)) {  // Biomart ou Organoplant
                    if(operacoes == 1) { sqlWhere += ` and OPERACOES_ACAO = 'VN' `; }; // Somente Venda
                    if(operacoes == 2) {     // Somente Insumos
                        sqlWhere += `  and OPERACOES_ACAO = 'VN'
                                       and ((left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '5101') or
                                           (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '6101') or
                                           (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '6122') or
                                           (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '6922') or                                           
                                           (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '5124') or
                                           (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '5922') or
                                           (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '5122')) `;
                    }
                    if(operacoes == 3) {     // Somente Industrializacao
                        sqlWhere += `  and OPERACOES_ACAO = 'IN'
                                       and MOVIMENTOSITENS_ID_PRODUTOS <> 1`;
                    }
                }

                if(params.estado && params.estado.toUpperCase() != 'TODOS') {
                    sqlWhere += ` and CIDADES_ESTADO = '${params.estado}' `;
                }

                const sqlDocumento = documento == 0 ? '0002' :  // Pedido
                                     documento == 1 ? '0003' :  // Nota
                                     documento == 2 ? '0004' :  // Requisição
                                     documento == 3 ? '0011' :  // Cupom Fiscal
                                     documento == 4 ? '0001' :  // Orçamento
                                     '';
 
                if(params.tipo == 0) {
                    sqlSearch = `select MOVIMENTOS_ID, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 
                                        MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_NOME, CIDADES_NOME, CIDADES_ESTADO, 
                                        MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_NUMEROORIGEM, MOVIMENTOS_SERIEORIGEM, 
                                        MOVIMENTOS_TOTAL, MOVIMENTOS_FRETE, MOVIMENTOS_DESPESAS, MOVIMENTOSITENS_ID_PRODUTOS, 
                                        PRODUTOS_NOME, MOVIMENTOSITENS_QUANTIDADE, 
                                        MOVIMENTOSITENS_ID_OPERACOES,
                                        MOVIMENTOSENVIO_PESOLIQUIDO,
                                        PRODUTOS_PESOLIQUIDO,
                                        MOVIMENTOSCAIXA_DUPLICATA,                                        
                                        (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOSITENS_TOTAL
                                FROM MOVIMENTOSITENS
                                left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                left outer join MOVIMENTOSENVIO on MOVIMENTOSENVIO_ID_MOVIMENTOS = MOVIMENTOSITENS_ID_MOVIMENTOS
                                left outer join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOSITENS_ID_MOVIMENTOS
                                left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                                left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                                where ((MOVIMENTOS_STATUS <> 'C') and 
                                       (MOVIMENTOS_STATUS <> 'D') and
                                       (MOVIMENTOS_STATUS <> 'R') and
                                       (MOVIMENTOS_STATUS <> 'V')) and
                                right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '${sqlDocumento}' and
                                MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                                ${sqlWhere}
                                ORDER BY MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO`
                } else if(params.tipo == 1) { // Sintetico
                    sqlSearch = `select MOVIMENTOS_ID, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 
                                        MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_NOME, CIDADES_NOME, CIDADES_ESTADO, 
                                        MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_NUMEROORIGEM, MOVIMENTOS_SERIEORIGEM, 
                                        MOVIMENTOS_TOTAL, MOVIMENTOS_FRETE, MOVIMENTOS_DESPESAS, MOVIMENTOSITENS_ID_PRODUTOS, 
                                        PRODUTOS_NOME, MOVIMENTOSITENS_QUANTIDADE, 
                                        MOVIMENTOSITENS_ID_OPERACOES,
                                        MOVIMENTOSENVIO_PESOLIQUIDO,
                                        PRODUTOS_PESOLIQUIDO,
                                        MOVIMENTOSCAIXA_DUPLICATA,                                        
                                        (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOSITENS_TOTAL
                                FROM MOVIMENTOS
                                left outer join MOVIMENTOSITENS ON MOVIMENTOSITENS_ID = MOVIMENTOS_ID
                                left outer join MOVIMENTOSENVIO on MOVIMENTOSENVIO_ID_MOVIMENTOS = MOVIMENTOS_ID
                                left outer join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                                left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                                left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                                where ((MOVIMENTOS_STATUS <> 'C') and 
                                       (MOVIMENTOS_STATUS <> 'D') and
                                       (MOVIMENTOS_STATUS <> 'R') and
                                       (MOVIMENTOS_STATUS <> 'V')) and
                                right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '${sqlDocumento}' and
                                MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                                ${sqlWhere}
                                ORDER BY MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO`
                } else { // Produto
                    sqlSearch = `select MOVIMENTOS_ID, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 
                                        MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_NOME, PESSOAS_NOME, CIDADES_NOME, CIDADES_ESTADO, 
                                        MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_NUMEROORIGEM, MOVIMENTOS_SERIEORIGEM, 
                                        MOVIMENTOS_TOTAL, MOVIMENTOS_FRETE, MOVIMENTOS_DESPESAS, MOVIMENTOSITENS_ID_PRODUTOS, 
                                        PRODUTOS_NOME, PRODUTOS_UNIDADE, PRODUTOS_FABRICA, MOVIMENTOSITENS_QUANTIDADE, 
                                        MOVIMENTOSITENS_ID_OPERACOES,
                                        MOVIMENTOSENVIO_PESOLIQUIDO,
                                        PRODUTOS_PESOLIQUIDO,
                                        MOVIMENTOSCAIXA_DUPLICATA,                                        
                                        (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOSITENS_TOTAL
                                FROM MOVIMENTOSITENS
                                left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                left outer join MOVIMENTOSENVIO on MOVIMENTOSENVIO_ID_MOVIMENTOS = MOVIMENTOSITENS_ID_MOVIMENTOS
                                left outer join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOSITENS_ID_MOVIMENTOS
                                left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                                left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                                where ((MOVIMENTOS_STATUS <> 'C') and 
                                       (MOVIMENTOS_STATUS <> 'D') and
                                       (MOVIMENTOS_STATUS <> 'R') and
                                       (MOVIMENTOS_STATUS <> 'V')) and
                                right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '${sqlDocumento}' and
                                MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                                ${sqlWhere}
                                ORDER BY MOVIMENTOS_ID_PESSOAS, MOVIMENTOSITENS_ID_PRODUTOS`
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
