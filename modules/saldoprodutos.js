'use strict';

const samosFB = require('../services/samosFirebird');
const api     = require('../modules');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, tipo, status, quebra, pessoainicial, pessoafinal, grupoinicial, grupofinal, produtoinicial, produtofinal } = params;
            const db = await samosFB.conectarBanco(params.client);

            let parPessoainicial = (pessoainicial > 0 ? pessoainicial : 1);
            let parPessoafinal  = (pessoafinal > 0 ? pessoafinal : 999999);
            let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
            let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);
            let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
            let parProdutofinal  = (produtofinal > 0 ? produtofinal : 9999999);


            let sqlWhere = '';
            let sqlOrder = '';
            
            if((params.log || '').toUpperCase().match(/HERMES/)) {
                if(parPessoainicial == 1 && parPessoafinal == 999999 && parGrupoinicial == 1 && parGrupofinal == 999999) {
                    sqlOrder = 'PRODUTOS_NOME';
                } else if(parPessoafinal != 999999 && parGrupofinal != 999999) {
                    sqlOrder = 'PRODUTOS_ID_PESSOAS, PRODUTOS_ID_GRUPOS, PRODUTOS_NOME';
                } else if(parPessoafinal != 999999 && parGrupofinal == 999999) {
                    sqlOrder = 'PRODUTOS_ID_PESSOAS, PRODUTOS_NOME';
                } else if(parPessoafinal == 999999 && parGrupofinal != 999999) {
                    sqlOrder = 'PRODUTOS_ID_GRUPOS, PRODUTOS_NOME';
                }
            } else if((params.log || '').toUpperCase().match(/SANTANA/)) {
                sqlOrder = 'PRODUTOS_ID_GRUPOS, PRODUTOS_NOME';
            } else if((params.log || '').toUpperCase().match(/TURBOTEC/)) {
                if(params.ordem == 0) {
                    sqlOrder = 'PRODUTOS_ID_GRUPOS, PRODUTOS_NOME';
                } else {
                    sqlOrder = 'PRODUTOS_ID_GRUPOS, PRODUTOS_FABRICA, PRODUTOS_NOME';
                }
            } else {
                sqlOrder = (parPessoainicial == 1 && parPessoafinal == 999999 ? 'PRODUTOS_NOME' : 'PRODUTOS_ID_PESSOAS, PRODUTOS_NOME');
            }

            sqlWhere += `PRODUTOS_ID_PESSOAS between ${parPessoainicial} and ${parPessoafinal} and `;
            sqlWhere += `PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} and `
            sqlWhere += `PRODUTOS_ID between ${parProdutoinicial} and ${parProdutofinal} and `

            if(status != '') {
                if((params.client || '').toUpperCase().match(/MOVEIS/) && status == 'T')  {  // Ativo da Pruden/Stilo traz o fora de linha
                    sqlWhere += `(PRODUTOS_STATUS = 'T' or PRODUTOS_STATUS = 'L') and `;
                } else if (status == 'T') {
                    sqlWhere += ` PRODUTOS_STATUS <> 'F' and `;
                } else  {
                    sqlWhere += ` PRODUTOS_STATUS = '${status}' and `;
                }    
            }

            if(tipo == 0) {
                sqlWhere += `SALDOS_DISPONIVEL > 0 and `;  // 0 - Positivo
            } else if(tipo == 1) {
                sqlWhere += `SALDOS_DISPONIVEL < 0 and `;  // 1 - Negativo
            } else if(tipo == 2) {
                sqlWhere += `SALDOS_DISPONIVEL = 0 and `;  // 2 - Zerado
            } else if(tipo == 3) {
                sqlWhere += `SALDOS_DISPONIVEL <> 0 and `; // 3 - Positivo ou Negativo
            } else if(tipo == 5) {
                sqlWhere += `SALDOS_DISPONIVEL < SALDOS_MINIMO and `; // Abaixo do mínimo
            } else if(tipo == 6) {
                sqlWhere += `SALDOS_DISPONIVEL > SALDOS_MAXIMO and `; // Acima do máximo
            } else if(tipo == 7) {
                sqlWhere += `PRODUTOS_PESOBRUTO > 0 and `; // Com peso bruto
            } else if(tipo == 8) {
                sqlWhere += `PRODUTOS_PESOBRUTO <= 0 and `; // Sem peso bruto
            } else if(tipo == 9) {
                sqlWhere += `SALDOS_MARGEM > 0 and `; // Com margem
            } else if(tipo == 10) {
                sqlWhere += `SALDOS_MARGEM <= 0 and `; // Sem margem
            }

            const sqlIds = `select PRODUTOS_ID from PRODUTOS
                            where PRODUTOS_ID_PESSOAS between ${parPessoainicial} and ${parPessoafinal} and 
                                  PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal}`;
                                  
            db.query(sqlIds, async (error, resultsIds) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlIds);
                } else {
                    await api['processos/atualizasaldo']().create({
                        empresa : empresa,
                        produtos: (resultsIds || []).map(item => item['PRODUTOS_ID']),
                        client  : params.client
                    });

                    let sqlSearch = `select PRODUTOS_ID, 
                                            PRODUTOS_FABRICA, 
                                            PRODUTOS_MARCA, 
                                            PRODUTOS_NOME, 
                                            PRODUTOS_UNIDADE, 
                                            PRODUTOS_ID_GRUPOS,
                                            PRODUTOS_APLICACAO, 
                                            PRODUTOS_ID_PESSOAS, 
                                            PRODUTOS_PESOBRUTO, 
                                            SALDOS_CUSTO, 
                                            SALDOS_COMPRA, 
                                            SALDOS_PRECO, 
                                            SALDOS_MARGEM, 
                                            SALDOS_MARGEMMINIMA,
                                            SALDOS_MAXIMO, 
                                            SALDOS_MINIMO, 
                                            SALDOS_DISPONIVEL, 
                                            SALDOS_TRANSFERENCIA,
                                            GRUPOS_NOME, 
                                            PESSOAS_NOME
                                    from PRODUTOS
                                    left outer join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                                    left outer join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                                    left outer join PESSOAS on PESSOAS_ID = PRODUTOS_ID_PESSOAS
                                    where ${sqlWhere}
                                            PRODUTOS_NOME <> ''
                                    order by ${sqlOrder}`

                    db.query(sqlSearch, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                        } else {

                            samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                        }
                    });
                }
            });                
        });
    }
};