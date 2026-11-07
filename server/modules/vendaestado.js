'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
                const { empresa, operacoes, documento, inicio, final, pesinicio, pesfinal, grpinicio, grpfinal, proinicio, profinal} = params;
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
              
                sqlWhere += ` and OPERACOES_ACAO = 'VN' `; // Apenas vendas

                if(params.estado && params.estado.toUpperCase() != 'TODOS') {
                    sqlWhere += ` and CIDADES_ESTADO = '${params.estado}' `;
                }

                const sqlDocumento = documento == 0 ? '0002' :  // Pedido
                                     documento == 1 ? '0003' :  // Nota
                                     documento == 2 ? '0004' :  // Requisição
                                     documento == 3 ? '0011' :  // Cupom Fiscal
                                     documento == 4 ? '0001' :  // Orçamento
                                     '';
 
                    sqlSearch = `select MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_UNIDADE, CIDADES_ESTADO, sum(MOVIMENTOSITENS_QUANTIDADE) as QUANTIDADE_TOTAL
                                FROM MOVIMENTOSITENS
                                left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                                where ((MOVIMENTOS_STATUS <> 'C') and 
                                       (MOVIMENTOS_STATUS <> 'D') and
                                       (MOVIMENTOS_STATUS <> 'R') and
                                       (MOVIMENTOS_STATUS <> 'V')) and
                                right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '${sqlDocumento}' and
                                MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                                ${sqlWhere}
                                group by MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_UNIDADE, CIDADES_ESTADO
                                ORDER BY CIDADES_ESTADO, PRODUTOS_NOME`;
                
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
