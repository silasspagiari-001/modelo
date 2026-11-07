'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, tipo, vendedor, inicio, final} = params;
            let sqlWhere = '';
            let sqlSearch = '';

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if(vendedor > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
            }
            
            if (tipo == '0') {  // Relatório Sintético
                sqlSearch = `select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'DIN' as TIPO, sum(MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) as BASE,
                                sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.01) ELSE 0 END) COMISSAO01,
                                sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.01) ELSE 0 END) COMISSAO02,
                                sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.018) ELSE 0 END) COMISSAO03,
                                sum(case when MOVIMENTOS_MARGEM >= 35
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.02) ELSE 0 END) COMISSAO04           
                             from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                      DOCUMENTOS_NOME = 'Pedidos' and
                      (MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) > 0 and
                      MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO
                
                union
                
                select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'FIN' as TIPO, sum(MOVIMENTOSCAIXA_DUPLICATA) as BASE,
                    sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                        then (MOVIMENTOSCAIXA_DUPLICATA * 0.005) ELSE 0 END) COMISSAO01,
                    sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                        then (MOVIMENTOSCAIXA_DUPLICATA * 0.005) ELSE 0 END) COMISSAO02,
                    sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                        then (MOVIMENTOSCAIXA_DUPLICATA * 0.01) ELSE 0 END) COMISSAO03,
                    sum(case when MOVIMENTOS_MARGEM >= 35
                        then (MOVIMENTOSCAIXA_DUPLICATA * 0.013) ELSE 0 END) COMISSAO04           
                    from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                      DOCUMENTOS_NOME = 'Pedidos' and 
                      MOVIMENTOSCAIXA_DUPLICATA > 0 and                      
                      MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO
                
                union
                
                select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'CAR' as TIPO, sum(MOVIMENTOSCAIXA_CREDITO) as BASE,
                sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                    then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO01,
                sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                    then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO02,
                sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                    then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO03,
                sum(case when MOVIMENTOS_MARGEM >= 35
                    then (MOVIMENTOSCAIXA_CREDITO * 0.013) ELSE 0 END) COMISSAO04
                           
                    from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS                
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                      DOCUMENTOS_NOME = 'Pedidos' and
                      MOVIMENTOSCAIXA_CREDITO > 0 and
                      MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO
                
                union
                
                select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'CHE' as TIPO, sum(MOVIMENTOSCAIXA_CHEQUE) as BASE,
                    sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                        then (MOVIMENTOSCAIXA_CHEQUE * 0.01) ELSE 0 END) COMISSAO01,
                    sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                        then (MOVIMENTOSCAIXA_CHEQUE * 0.01) ELSE 0 END) COMISSAO02,
                    sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                        then (MOVIMENTOSCAIXA_CHEQUE * 0.018) ELSE 0 END) COMISSAO03,
                    sum(case when MOVIMENTOS_MARGEM >= 35
                        then (MOVIMENTOSCAIXA_CHEQUE * 0.02) ELSE 0 END) COMISSAO04
                       
                    from MOVIMENTOS 
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS                
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                      DOCUMENTOS_NOME = 'Pedidos' and
                      MOVIMENTOSCAIXA_CHEQUE > 0 and
                      MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO`
            } else {    // Analítico
                sqlSearch = `select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'DIN' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM,
                                sum(MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) as BASE,
                                sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.01) ELSE 0 END) COMISSAO01,
                                sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.01) ELSE 0 END) COMISSAO02,
                                sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.018) ELSE 0 END) COMISSAO03,
                                sum(case when MOVIMENTOS_MARGEM >= 35
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.02) ELSE 0 END) COMISSAO04           
                             from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where MOVIMENTOSCAIXA_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                      DOCUMENTOS_NOME = 'Pedidos' and
                      (MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) > 0 and
                      MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM
                
                union
                
                select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'FIN' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM, 
                    sum(MOVIMENTOSCAIXA_DUPLICATA) as BASE,
                    sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                        then (MOVIMENTOSCAIXA_DUPLICATA * 0.005) ELSE 0 END) COMISSAO01,
                    sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                        then (MOVIMENTOSCAIXA_DUPLICATA * 0.005) ELSE 0 END) COMISSAO02,
                    sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                        then (MOVIMENTOSCAIXA_DUPLICATA * 0.01) ELSE 0 END) COMISSAO03,
                    sum(case when MOVIMENTOS_MARGEM >= 35
                        then (MOVIMENTOSCAIXA_DUPLICATA * 0.013) ELSE 0 END) COMISSAO04
           
                       from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                      DOCUMENTOS_NOME = 'Pedidos' and MOVIMENTOSCAIXA_DUPLICATA > 0 and
                      MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM
                
                union
                
                select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'CAR' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM,
                sum(MOVIMENTOSCAIXA_CREDITO) as BASE,
                sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                    then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO01,
                sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                    then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO02,
                sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                    then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO03,
                sum(case when MOVIMENTOS_MARGEM >= 35
                    then (MOVIMENTOSCAIXA_CREDITO * 0.013) ELSE 0 END) COMISSAO04
                           
                    from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS                
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                      DOCUMENTOS_NOME = 'Pedidos' and
                      MOVIMENTOSCAIXA_CREDITO > 0 and
                      MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM
                
                union
                
                select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'CHE' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM, 
                    sum(MOVIMENTOSCAIXA_CHEQUE) as BASE,
                    sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                        then (MOVIMENTOSCAIXA_CHEQUE * 0.01) ELSE 0 END) COMISSAO01,
                    sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                        then (MOVIMENTOSCAIXA_CHEQUE * 0.01) ELSE 0 END) COMISSAO02,
                    sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                        then (MOVIMENTOSCAIXA_CHEQUE * 0.018) ELSE 0 END) COMISSAO03,
                    sum(case when MOVIMENTOS_MARGEM >= 35
                        then (MOVIMENTOSCAIXA_CHEQUE * 0.02) ELSE 0 END) COMISSAO04
                       
                    from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                      DOCUMENTOS_NOME = 'Pedidos' and
                      MOVIMENTOSCAIXA_CHEQUE > 0 and
                      MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM`
            }
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar comissões fin';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
