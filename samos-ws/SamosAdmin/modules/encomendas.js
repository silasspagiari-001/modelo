'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { 
                empresa, 
                nomedocumento, 
                numero, 
                pessoa, 
                inicio, 
                final, 
                ordem, 
                status, 
                start, 
                limit 
            } = params;

            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

            let sqlOrder = '';
            let sqlEmpresa       = empresa       ? `and MOVIMENTOS_ID_EMPRESAS   = '${empresa}'       ` : '';
            let sqlNomeDocumento = nomedocumento ? `and DOCUMENTOS_NOME          = '${nomedocumento}' ` : '';
            let sqlWhere = `where MOVIMENTOS_ID > 0 ${sqlEmpresa} ${sqlNomeDocumento} `;
                
            if(numero > 0) {
                sqlWhere += ` and MOVIMENTOS_NUMERO = '${numero}'`;
                sqlOrder = ` order by MOVIMENTOS_NUMERO `;    
            } else {
                if(pessoa > 0) {
                    sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = '${pessoa}' `; 
                }
                
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    if (ordem == 3) { // Entrada/Saida
                        sqlWhere += ` and MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    } else {
                        sqlWhere += ` and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    }
                }

                if(ordem == 0) {
                    sqlOrder = ` order by MOVIMENTOS_EMISSAO, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by MOVIMENTOS_NUMERO `;
                } else if (ordem == 3) {
                    sqlOrder = ` order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
                }  

                if(status == 0) {
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'N' `; 
                } else if(status == 1) {
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'F' `; 
                }
            }
                    
            const sqlCount  = `select count(MOVIMENTOS_ID) from MOVIMENTOS
                    join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                    ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    MOVIMENTOS.*, 
                    EMPRESAS_ID_CIDADES,
                    PESSOAS_ID_CIDADES,
                    CIDADES_NOME,
                    CIDADES_ESTADO, 
                    DOCUMENTOS_ID_PESSOAS,
                    USUARIOS_LOGIN,
                    EMPRESAS_FANTASIA,
                    EMPRESAS_NOME,
                    DOCUMENTOS_NOME
                from MOVIMENTOS 
                    left join USUARIOS        on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                    join DOCUMENTOS           on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                    join EMPRESAS             on EMPRESAS_ID   = MOVIMENTOS_ID_EMPRESAS
                    left join PESSOAS         on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                    left join CIDADES         on CIDADES_ID    = PESSOAS_ID_CIDADES
                ${sqlWhere} ${sqlOrder}`; 

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);

            return { results, total };

        } catch(error) {
            const msg = 'Falha ao buscar encomendas';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {//pode ser um id ou uma lista de ids separada por vírgula
        try {
            const ids = id.split(',');

            let sqlWhere = ` where `;
            
            if(params.empresa && params.numero && params.serie) {
                sqlWhere += ` MOVIMENTOS_ID_EMPRESAS = ${params.empresa} and
                              MOVIMENTOS_NUMERO      = ${params.numero}  and
                              MOVIMENTOS_SERIE       = '${params.serie}' `;
            } else {
                sqlWhere += ids.reduce((result, id) => {
                    return result += ` MOVIMENTOS_ID = '${id}' or `
                }, '').slice(0, -3);
            }

            const sqlOrder = ` order by MOVIMENTOS_ID `;
            const sqlSearch = `select 
                MOVIMENTOS.*,
                EMPRESAS_ID_CIDADES,
                EMPRESAS_NOME,
                EMPRESAS_FANTASIA,
                EMPRESAS_ENDERECO,
                EMPRESAS_NUMERO,
                EMPRESAS_BAIRRO,
                EMPRESAS_CEP,
                EMPRESAS_CPFCNPJ,
                EMPRESAS_INSCRICAO,
                EMPRESAS_MUNICIPAL,
                EMPRESAS_CELULAR,
                EMPRESAS_SIMPLES,
                EMPRESAS_TELEFONE,
                EMPRESAS_EMAIL,
                EMPRESAS_PAGINA,
                PESSOAS_ENDERECO,
                PESSOAS_NUMERO,
                PESSOAS_BAIRRO,
                PESSOAS_CEP,
                PESSOAS_INSCRICAO,
                PESSOAS_TELEFONE,
                PESSOAS_CREDITO,
                PESSOAS_ID_CIDADES,
                PESSOAS_OBSERVACOES,
                CIDADES_NOME,
                CIDADES_ESTADO,
                USUARIOS_NOME,
                USUARIOS_LOGIN,
                OPERACOES_NOME,
                OPERACOES_ACAO,
                MOVIMENTOS_ID_DOCUMENTOS,
                DOCUMENTOS_NOME,
                DOCUMENTOS_ID_PESSOAS,
                trim(DOCUMENTOS_LAYOUT) as DOCUMENTOS_LAYOUT,
                trim(MOVIMENTOS_STATUS) as MOVIMENTOS_STATUS,
                trim(MOVIMENTOS_SITUACAO) as MOVIMENTOS_SITUACAO
            from MOVIMENTOS
            left join EMPRESAS   on EMPRESAS_ID   = MOVIMENTOS_ID_EMPRESAS
            left join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
            left join CIDADES    on CIDADES.CIDADES_ID = PESSOAS_ID_CIDADES
            left join OPERACOES  on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
            left join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
            left join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
            ${sqlWhere} ${sqlOrder}`; 

            const results = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(results.map(async encomenda => {
                const sqlItens = `select 
                    MOVIMENTOSITENS_ID,
                    MOVIMENTOSITENS_ID_MOVIMENTOS,
                    MOVIMENTOSITENS_ID_OPERACOES,
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    MOVIMENTOSITENS_QUANTIDADE,
                    MOVIMENTOSITENS_PRECO,
                    MOVIMENTOSITENS_CUSTO,
                    MOVIMENTOSITENS_PERCENTUAL,
                    MOVIMENTOSITENS_DESCONTOS,
                    cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as numeric(12,2)) as MOVIMENTOSITENS_TOTAL,
                    MOVIMENTOSITENS_ICMS,
                    MOVIMENTOSITENS_BASEICMS,
                    MOVIMENTOSITENS_VALORICMS,
                    MOVIMENTOSITENS_IPI,
                    MOVIMENTOSITENS_VALORIPI,
                    MOVIMENTOSITENS_BASEST,
                    MOVIMENTOSITENS_VALORST,
                    MOVIMENTOSITENS_FRETE,
                    MOVIMENTOSITENS_SEGURO,
                    MOVIMENTOSITENS_DESPESAS,
                    MOVIMENTOSITENS_IMPOSTO,
                    MOVIMENTOSITENS_CST,
                    MOVIMENTOSITENS_ID_EMPRESAS,
                    MOVIMENTOSITENS_ENTREGUE,
                    MOVIMENTOSITENS_IMEDIATA,
                    MOVIMENTOSITENS_DATAMONTAGEM,
                    MOVIMENTOSITENS_HORAMONTAGEM,
                    MOVIMENTOSITENS_DATAENTREGA,
                    MOVIMENTOSITENS_HORAENTREGA,
                    MOVIMENTOSITENS_DEPOSITO,
                    PRODUTOS_NOME, PRODUTOS_DERIVADO, PRODUTOS_UNIDADE,
                    PRODUTOS_MARCA, PRODUTOS_APLICACAO,
                    cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO,
                    (iif(MOVIMENTOSITENS_QUANTIDADE > 0,cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) / MOVIMENTOSITENS_QUANTIDADE, 0)) as VALOR_LIQUIDO,
                    SALDOS_CUSTO, SALDOS_COMPRA, SALDOS_PRECO, SALDOS_PRAZO, SALDOS_DISPONIVEL, SALDOS_IPI, SALDOS_CSTLOCAL, SALDOS_CSTOUTROS,
                    SALDOS_ICMSLC, SALDOS_ICMS01, SALDOS_ICMS02, SALDOS_MARGEM,
                    SALDOS_BASELC, SALDOS_BASE01, SALDOS_BASE02,
                    EMPRESAS_FANTASIA
                from MOVIMENTOSITENS
                join MOVIMENTOS      on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
                left join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
                left join SALDOS     on SALDOS_ID_EMPRESAS = MOVIMENTOSITENS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                left join EMPRESAS   on EMPRESAS_ID        = MOVIMENTOSITENS_ID_EMPRESAS
                where MOVIMENTOSITENS_ID_MOVIMENTOS = ${encomenda['MOVIMENTOS_ID']} 
                order by MOVIMENTOSITENS_ID`;

                encomenda['MOVIMENTOS_ITENS'] = await samosFB.executeSQL(sqlItens, params);
            }));

            return { 
                results, 
                total: results.length 
            };

        } catch(error) {
            const msg = 'Falha ao buscar encomendas por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
    
    create: async (encomenda, params) => {
        try {
            const { numero, serie } = await samosFB.ultimoDocto('MOVIMENTOS', encomenda, params);
            
            encomenda['MOVIMENTOS_NUMERO']  = numero;
            encomenda['MOVIMENTOS_SERIE']   = serie;
            encomenda['MOVIMENTOS_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            encomenda['MOVIMENTOS_HORA']    = moment.tz(params.timezone).format('HH:mm:ss');
            encomenda['MOVIMENTOS_LOG']     = encomenda['USUARIOS_LOGIN'] + ' ' + encomenda['MOVIMENTOS_EMISSAO'].split('-').reverse().join('/') + ' ' + encomenda['MOVIMENTOS_HORA'];
            
            await samosFB.insert('MOVIMENTOS', encomenda, params);

            (encomenda['MOVIMENTOS_ITENS'] || []).forEach(item => {
                item['MOVIMENTOSITENS_ID_MOVIMENTOS'] = encomenda['MOVIMENTOS_ID'];
            });

            try {
                if((encomenda['MOVIMENTOS_ITENS'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSITENS', encomenda['MOVIMENTOS_ITENS'], params);
                }
            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from MOVIMENTOS       where MOVIMENTOS_ID                  = ${encomenda['MOVIMENTOS_ID']};
                        delete from MOVIMENTOSITENS  where MOVIMENTOSITENS_ID_MOVIMENTOS  = ${encomenda['MOVIMENTOS_ID']};
                    end
                `, params);

                throw error;
            }

            await utils.dblog(params);  

            return { results: encomenda };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar encomenda' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, encomenda, params) => {
        const itens = encomenda['MOVIMENTOS_ITENS'] || [];

        try {
            encomenda['MOVIMENTOS_LOG'] = encomenda['USUARIOS_LOGIN'] + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');

            await samosFB.update(id, 'MOVIMENTOS', encomenda, params);

            if(itens.length > 0) {
                const itensOriginais = await samosFB.executeSQL(`select * from MOVIMENTOSITENS where MOVIMENTOSITENS_ID_MOVIMENTOS = ${id}`, params);
                await samosFB.executeSQL(`delete from MOVIMENTOSITENS where MOVIMENTOSITENS_ID_MOVIMENTOS = ${id}`, params);
            
                itens.map(item => {
                    item['MOVIMENTOSITENS_ID_MOVIMENTOS'] = encomenda['MOVIMENTOS_ID'];
                });
                
                try {
                    await samosFB.insert('MOVIMENTOSITENS', encomenda['MOVIMENTOS_ITENS'], params);
                } catch(error) {
                    if(itensOriginais) {
                        await samosFB.insert('MOVIMENTOSITENS', itensOriginais, params);
                    }

                    throw error;
                }
            }
            
            await utils.dblog(params);

            return { results: encomenda };

        } catch(error) {
            const msg = error.message ? 'Falha ao alterar encomenda' : error;
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'MOVIMENTOS', params);
            await samosFB.delete(id, 'MOVIMENTOSITENS', 'MOVIMENTOS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar encomenda';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};