'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    create: (dataList, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const empresa = dataList.empresa;
            const situacaodev = dataList.situacaodev;
            const numerodev = dataList.numero;
            const seriedev = dataList.serie;
            const iddevolucao = dataList.iddevolucao;
            const empresaorigem = dataList.empresaorigem;
            const numeroorigem = dataList.numeroorigem;
            const serieorigem = dataList.serieorigem;
            const dataemissao = dataList.emissao;
            const horaemissao = dataList.hora;
            const valordevolvido = dataList.valordevolvido / 100;
            const pessoa = dataList.pessoa;
            const usuario = dataList.usuario;
            const logdevolucao = dataList.log;

            if(situacaodev == '0') {   // Abatimento do contas a receber

                const lastId = await samosFB.lastId(db, 'FINANCEIROSITENS', 'GEN_FINANCEIROSITENS_ID', 'FINANCEIROSITENS_ID');
    
                // busca o título do pedido que está sendo devolvido
                const sqlTitulo = `select FINANCEIROS_ID as FINANCEIROSORIGEM_ID from FINANCEIROS
                                   where FINANCEIROS_ID_EMPRESAS = ${empresaorigem} and
                                         FINANCEIROS_NUMERO = ${numeroorigem} and
                                         FINANCEIROS_SERIE = '${serieorigem}' and
                                         FINANCEIROS_STATUS = 'A'`
    
                db.query(sqlTitulo, (error, results) => {
                    if (error) {
                        samosFB.enviarRespostaErro(`Não há título em aberto para abater`, db, error, reject, sqlTitulo);
                    } else {
                        const dataListTitulo = results;
                        const idtituloorigem = dataListTitulo[0]['FINANCEIROSORIGEM_ID'];
                        // Insere o lançamento de devolução
                        const sqlInsercao = `insert into FINANCEIROSITENS (
                            FINANCEIROSITENS_ID,
                            FINANCEIROSITENS_ID_FINANCEIROS,
                            FINANCEIROSITENS_ID_APLICACOES,
                            FINANCEIROSITENS_ID_PORTADORES,
                            FINANCEIROSITENS_EMISSAO,
                            FINANCEIROSITENS_VALOR,
                            FINANCEIROSITENS_JUROS,
                            FINANCEIROSITENS_TAXAS,
                            FINANCEIROSITENS_DESCONTOS,
                            FINANCEIROSITENS_DEBITACREDITA,
                            FINANCEIROSITENS_OBSERVACOES,
                            FINANCEIROSITENS_LOG
                        ) values (
                            ${lastId},
                            ${idtituloorigem},
                            1,
                            1,
                            '${dataemissao}',
                            ${valordevolvido},
                            0,
                            0,
                            0,
                            'A',
                            'DEVOLUCAO - ${numerodev} ${seriedev}',
                            '${logdevolucao}'
                        )`;

                        db.query(sqlInsercao, (error, results) => {
                            if (error) {
                                samosFB.enviarRespostaErro(`Falha ao devolver título`, db, error, reject, sqlInsercao);
                            } else {
                                // faz o update no valor atual do título
                                const sqlAtualizacao = `update FINANCEIROS set 
                                        FINANCEIROS_ABERTO = (FINANCEIROS_ABERTO - ${valordevolvido})
                                        where FINANCEIROS_ID = ${idtituloorigem}`;
                                db.query(sqlAtualizacao, (error, results) => {
                                    if (error) {
                                        samosFB.enviarRespostaErro(`Falha ao atualizar o título`, db, error, reject, sqlAtualizacao);
                                    } else {
                                        samosFB.processarGravacao({db, results: dataList, resolve, reject});
                                    }
                                });
                            }
                        });         
                    }
                });
            };

            if(situacaodev == '1') {   // Crédito para o Cliente
                const sqlCliente = `update PESSOAS set PESSOAS_CREDITO = (PESSOAS_CREDITO + ${valordevolvido})
                                   where PESSOAS_ID = ${pessoa}`

                const lastId = await samosFB.lastId(db, 'CREDITOS', 'GEN_CREDITOS_ID', 'CREDITOS_ID');

                const sqlCredito = `insert into CREDITOS (CREDITOS_ID,
                                                          CREDITOS_ID_PESSOAS,
                                                          CREDITOS_EMISSAO,
                                                          CREDITOS_STATUS,
                                                          CREDITOS_TIPO,
                                                          CREDITOS_NOME,
                                                          CREDITOS_VALOR,
                                                          CREDITOS_LOG,
                                                          CREDITOS_ID_MOVIMENTOS) values 
                                                          (${lastId},
                                                           ${pessoa},
                                                           '${dataemissao}',
                                                           'C',
                                                           'E',
                                                           'Devolução - ${numerodev} ${seriedev}',
                                                           ${valordevolvido},
                                                           '${logdevolucao}',
                                                           0)`;

                db.query(sqlCliente, (error, results) => {
                    if (error) {
                        samosFB.enviarRespostaErro(`Falha ao atualizar Crédito da pessoa`, db, error, reject, sqlCliente);
                    } else {
                        db.query(sqlCredito, (error, results) => {
                            if (error) {
                                samosFB.enviarRespostaErro(`Falha ao lançar o crédito`, db, error, reject, sqlCredito);
                            } else {
                                samosFB.processarGravacao({db, results: dataList, resolve, reject}); 
                            }
                        });
                    }
                });
            };

            if(situacaodev == '2') {   // Sangria no caixa
                const lastId = await samosFB.lastId(db, 'MOVIMENTOSCAIXA', 'GEN_MOVIMENTOSCAIXA_ID', 'MOVIMENTOSCAIXA_ID');
        
                const sqlInsercao = `insert into MOVIMENTOSCAIXA (
                    MOVIMENTOSCAIXA_ID,
                    MOVIMENTOSCAIXA_ID_EMPRESAS,
                    MOVIMENTOSCAIXA_ID_USUARIOS,
                    MOVIMENTOSCAIXA_STATUS,
                    MOVIMENTOSCAIXA_ID_MOVIMENTOS,
                    MOVIMENTOSCAIXA_ID_PESSOAS,
                    MOVIMENTOSCAIXA_ID_APLICACOES,
                    MOVIMENTOSCAIXA_ID_FINANCEIROS,
                    MOVIMENTOSCAIXA_NOME,
                    MOVIMENTOSCAIXA_EMISSAO,
                    MOVIMENTOSCAIXA_HORA,
                    MOVIMENTOSCAIXA_TIPO,
                    MOVIMENTOSCAIXA_DINHEIRO,
                    MOVIMENTOSCAIXA_CHEQUE,
                    MOVIMENTOSCAIXA_DEBITO,
                    MOVIMENTOSCAIXA_CREDITO,
                    MOVIMENTOSCAIXA_CREDITOLOJA,
                    MOVIMENTOSCAIXA_CREDITOPESSOA,
                    MOVIMENTOSCAIXA_ALIMENTACAO,
                    MOVIMENTOSCAIXA_REFEICAO,
                    MOVIMENTOSCAIXA_PRESENTE,
                    MOVIMENTOSCAIXA_COMBUSTIVEL,
                    MOVIMENTOSCAIXA_DUPLICATA,
                    MOVIMENTOSCAIXA_BOLETO,
                    MOVIMENTOSCAIXA_OUTRO,
                    MOVIMENTOSCAIXA_TROCO,
                    MOVIMENTOSCAIXA_LOG,
                    MOVIMENTOSCAIXA_VENCIMENTO,
                    MOVIMENTOSCAIXA_EXPORTADO) values (
                    ${lastId},
                    ${empresa},
                    ${usuario},
                    'A',
                    ${iddevolucao},
                    ${pessoa},
                    1,
                    0,
                    'REF DEVOLUCAO - ${numerodev} ${seriedev} DO DOC ${numeroorigem} ${serieorigem}',
                    '${dataemissao}',
                    '${horaemissao}',
                    'S',
                    ${valordevolvido}, 0,0,0,0,0,0,0,0,0,0,0,0,0,
                    '${logdevolucao}',
                    '1899-12-30',
                    'N')`;

                db.query(sqlInsercao, (error, results) => {
                    if (error) {
                        samosFB.enviarRespostaErro(`Falha ao gravar sangria`, db, error, reject, sqlInsercao);
                    } else {
                        samosFB.processarGravacao({db, results: dataList, resolve, reject});
                    }
                });
            };
        });
    }
};
