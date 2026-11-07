'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { tipo, empresa, aplicacao, inicio, final} = params;
            const db = await samosFB.conectarBanco(params.client);
            let sqlWhere = '';
            let sqlSearch = '';
            let sqlAplicacao = ''

            if(params.log.toUpperCase().match(/MOVEIS/)) {
                sqlAplicacao = ' and substring(APLICACOES_MASCARA from 1 for 1) > 4';
            }

            if(empresa > 0) {
                sqlWhere += ` and FINANCEIROS_ID_EMPRESAS = ${empresa} `;
            }

            if(aplicacao > 0) {
                sqlWhere += ` and FINANCEIROS_ID_APLICACOES = ${aplicacao} `;
            }

            sqlSearch = `execute block returns (
                                APLICACOES_ID integer, APLICACOES_MASCARA varchar(13),
                                APLICACOES_NOME varchar(50), FINANCEIROS_TOTALORIGINAL numeric(14,2)
                            )
                            as
                            begin
                                for
                                    select APLICACOES_ID, APLICACOES_MASCARA,
                                        APLICACOES_NOME from APLICACOES
                                    where APLICACOES_TIPO = 'D' ${sqlAplicacao}
                                    order by APLICACOES_MASCARA, APLICACOES_ID
                                    into :APLICACOES_ID,
                                        :APLICACOES_MASCARA,
                                        :APLICACOES_NOME
                                do
                                    begin
                                        FINANCEIROS_TOTALORIGINAL = 0;
                                        select sum(FINANCEIROS_ORIGINAL) from FINANCEIROS
                                        join APLICACOES on APLICACOES_ID = FINANCEIROS_ID_APLICACOES
                                        where FINANCEIROS_ID_APLICACOES = :APLICACOES_ID and
                                            FINANCEIROS_PAGAMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                                            ${sqlWhere}
                                        into
                                            :FINANCEIROS_TOTALORIGINAL;
                                        if (FINANCEIROS_TOTALORIGINAL > 0) then  suspend;
                                    end
                            end;`

            db.query(sqlSearch, async (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
 
                    const somaVendas   = results.length ? await obterSomaDemonstrativo('V', params, db) : 0;
                    const somaFretes   = results.length ? await obterSomaDemonstrativo('F', params, db) : 0;
                    const somaCustoVda = results.length ? await obterSomaDemonstrativo('C', params, db) : 0;

                    results = results.map(result => {
                        result['FINANCEIROS_GERAL_VENDAS'] = somaVendas;
                        result['FINANCEIROS_GERAL_FRETES']   = somaFretes;
                        result['FINANCEIROS_GERAL_CUSTOS']   = somaCustoVda;
                        return result;
                    });

                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                }
            });
        });
    }
};

const obterSomaDemonstrativo = function(status, params, db) {
    return new Promise(async (resolve, reject) => {
        const { empresa, inicio, final} = params;

        let sql = '';

        let isMoveis = params.log.toUpperCase().match(/MOVEIS/);
      
        if(status == 'V') {  // Vendas (Valor total ou partida se for de móveis)  

            const sqlEmpVenda = empresa > 0  ? ` and MOVIMENTOS_ID_EMPRESAS   = ${empresa}   ` : '';
            const campoCalcular = isMoveis ? 'MOVIMENTOSITENS_IMPOSTO' : 'MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS';

            if(empresa > 0 && empresa == 99) { // Makita o faturamento é pelo contas a receber
                sql = `select sum(FINANCEIROS_ORIGINAL) from FINANCEIROS
                where FINANCEIROS_TIPO = 'R' and
                      FINANCEIROS_ID_EMPRESAS = ${empresa} and
                      FINANCEIROS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'`;
            } else {
                sql = `select sum(${campoCalcular})
                from MOVIMENTOSITENS
                left join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                where MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) and MOVIMENTOS_STATUS <> 'C'  and
                      MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                      ${sqlEmpVenda}`;
            }
        } else {
            if(status == 'F') { // Fretes
                const sqlEmpFrete = empresa > 0  ? ` and FINANCEIROS_ID_EMPRESAS   = ${empresa}   ` : '';
                sql = `select sum(FINANCEIROS_ORIGINAL) from FINANCEIROS
                              left join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                       where PESSOAS_TIPO = 'D' and FINANCEIROS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                             ${sqlEmpFrete}`;
            } else {  // Custo (na ocasião da venda)
                const sqlEmpCusto = empresa > 0 ? ` and MOVIMENTOS_ID_EMPRESAS   = ${empresa}   ` : '';
                sql = `select sum(MOVIMENTOSITENS_CUSTO * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
                              join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                              join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                       where MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) and MOVIMENTOS_STATUS <> 'C'  and
                             MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                             ${sqlEmpCusto}`;    
            }
        }

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error)
                reject();
            } else {
                resolve(results[0]['SUM'] || 0);
            }
        });
    });
};
