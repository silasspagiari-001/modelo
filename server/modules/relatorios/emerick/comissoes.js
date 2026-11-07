'use strict';

const samosFB = require('../../../services/samosFirebird');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, tipo, vendedor, inicio, final} = params;
            const db = await samosFB.conectarBanco(params.client);
            let sqlWhere = '';
            let sqlSearch = '';

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if(vendedor > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
            }

            if (tipo == '0') {  // Relatório Sintético
                sqlSearch = `select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'DIN' as TIPO, sum(MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) as BASE,
                                sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) * 0.01) ELSE 0 END) COMISSAO01,
                                sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) * 0.01) ELSE 0 END) COMISSAO02,
                                sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) * 0.018) ELSE 0 END) COMISSAO03,
                                sum(case when MOVIMENTOS_MARGEM >= 35
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) * 0.02) ELSE 0 END) COMISSAO04           
                                from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                        (MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) > 0 and
                        MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO
                
                union
                
                select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'FIN' as TIPO, sum(FINANCEIROS_PAGO) as BASE,
                    sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                        then (FINANCEIROS_PAGO * 0.005) ELSE 0 END) COMISSAO01,
                    sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                        then (FINANCEIROS_PAGO * 0.005) ELSE 0 END) COMISSAO02,
                    sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                        then (FINANCEIROS_PAGO * 0.01) ELSE 0 END) COMISSAO03,
                    sum(case when MOVIMENTOS_MARGEM >= 35
                        then (FINANCEIROS_PAGO * 0.013) ELSE 0 END) COMISSAO04           
                    from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join FINANCEIROS     on FINANCEIROS_ID_MOVIMENTOS = MOVIMENTOS_ID and FINANCEIROS_NUMERO = MOVIMENTOS_NUMERO and FINANCEIROS_SERIE = MOVIMENTOS_SERIE and FINANCEIROS_TIPO = 'R'
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where FINANCEIROS_PAGAMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        FINANCEIROS_EMISSAO >= '01.10.2021' and
                        right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
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
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
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
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                        MOVIMENTOSCAIXA_CHEQUE > 0 and
                        MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO`
            } else {    // Analítico
                sqlSearch = `select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'DIN' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM,
                                sum(MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) as BASE,
                                sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) * 0.01) ELSE 0 END) COMISSAO01,
                                sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) * 0.01) ELSE 0 END) COMISSAO02,
                                sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) * 0.018) ELSE 0 END) COMISSAO03,
                                sum(case when MOVIMENTOS_MARGEM >= 35
                                    then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) * 0.02) ELSE 0 END) COMISSAO04
                                from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where MOVIMENTOSCAIXA_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                        (MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) > 0 and
                        MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM
                
                union
                
                select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'FIN' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM, 
                    sum(FINANCEIROS_PAGO) as BASE,
                    sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
                        then (FINANCEIROS_PAGO * 0.005) ELSE 0 END) COMISSAO01,
                    sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
                        then (FINANCEIROS_PAGO * 0.005) ELSE 0 END) COMISSAO02,
                    sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
                        then (FINANCEIROS_PAGO * 0.01) ELSE 0 END) COMISSAO03,
                    sum(case when MOVIMENTOS_MARGEM >= 35
                        then (FINANCEIROS_PAGO * 0.013) ELSE 0 END) COMISSAO04
            
                        from MOVIMENTOS
                join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                join FINANCEIROS on FINANCEIROS_ID_MOVIMENTOS = MOVIMENTOS_ID and FINANCEIROS_NUMERO = MOVIMENTOS_NUMERO and FINANCEIROS_SERIE = MOVIMENTOS_SERIE and FINANCEIROS_TIPO = 'R'
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
                where FINANCEIROS_PAGAMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        FINANCEIROS_EMISSAO >= '01.10.2021' and
                        right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                        MOVIMENTOSCAIXA_DUPLICATA > 0 and
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
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
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
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                        MOVIMENTOSCAIXA_CHEQUE > 0 and
                        MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
                group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM`
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