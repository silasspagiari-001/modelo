'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { 
                empresa, 
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
            let sqlEmpresa = empresa ? `and ORDENS_ID_EMPRESAS = ${empresa} ` : '';
            let sqlWhere = `where ORDENS_ID > 0 ${sqlEmpresa} `;
                
            if((numero || '').match(/,/) && numero.split(',').length > 0) {
                const numeros = numero.split(',');

                sqlWhere += ' and (';
                sqlWhere += numeros.reduce((str, num) => {
                    return `${str} ORDENS_NUMERO = ${num} or `;
                }, '').slice(0, -3);
                sqlWhere += ') ';

                sqlOrder = ` order by ORDENS_NUMERO `;    
            } else if(numero > 0 && ordem != 3) {
                sqlWhere += ` and ORDENS_NUMERO = ${numero}`;
                sqlOrder = ` order by ORDENS_NUMERO `;    
            } else if(numero != '' && ordem == 3) {
                sqlWhere += ` and ORDENS_REFERENCIA like '%${numero}%'`;
                sqlOrder = ` order by ORDENS_REFERENCIA `;    
            } else {
                if(pessoa > 0) {
                    sqlWhere += ` and ORDENS_ID_PESSOAS = '${pessoa}' `; 
                }
                                
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and ORDENS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }

                if (ordem == 1) {
                    sqlOrder = ` order by ORDENS_ID_PESSOAS, ORDENS_ID_EMPRESAS, ORDENS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by ORDENS_NUMERO `;
                } else if (ordem == 3) {
                    sqlOrder = ` order by ORDENS_REFERENCIA `;
                } else {
                    sqlOrder = ` order by ORDENS_EMISSAO, ORDENS_ID_EMPRESAS, ORDENS_ID `;
                }

                if (status != 'T') {
                    sqlWhere += ` and ORDENS_STATUS = '${status}' `;
                }
            }
                    
            const sqlCount  = `select count(ORDENS_ID) from ORDENS ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    ORDENS_ID,
                    ORDENS_ID_EMPRESAS,
                    ORDENS_ID_USUARIOS,
                    ORDENS_ID_PESSOAS,
                    ORDENS_NUMERO,
                    ORDENS_SERIE,
                    ORDENS_STATUS,
                    ORDENS_EMISSAO,
                    ORDENS_REABERTURA,
                    ORDENS_NOME,
                    ORDENS_CELULAR,
                    PESSOAS.PESSOAS_ENDERECO,
                    PESSOAS.PESSOAS_BAIRRO,
                    ORDENS_REFERENCIA,
                    MOVIMENTOS_ID,
                    ORDENS_TOTAL,
                    CIDADES_NOME,
                    CIDADES_ESTADO
                from ORDENS 
                    left join PESSOAS as PESSOAS on PESSOAS_ID = ORDENS_ID_PESSOAS
                    left join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                    left join PESSOAS as PESSOASMONTADOR on PESSOASMONTADOR.PESSOAS_ID = ORDENS_ID_USUARIOS
                    left outer join MOVIMENTOS on MOVIMENTOS_PROTOCOLO = ORDENS_REFERENCIA
                ${sqlWhere} ${sqlOrder} `; 

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);

            return { results, total };

        } catch(error) {
            const msg = 'Falha ao buscar ordens';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {//pode ser um id ou uma lista de ids separada por vírgula
        try {
            const ids = id.toString().split(',');

            let sqlWhere = ` where `;
         
            sqlWhere += ids.reduce((result, id) => {
                return result += ` ORDENS_ID = '${id}' or `
            }, '').slice(0, -3);

            const sqlOrder = ` order by ORDENS_ID `;

            const sqlSearch = `
                select ORDENS.*,
                    EMPRESAS_FANTASIA,
                    EMPRESAS_MUNICIPAL,
                    EMPRESAS_CPFCNPJ, 
                    EMPRESAS_INSCRICAO,
                    EMPRESAS_TELEFONE,
                    EMPRESAS_CELULAR,
                    EMPRESAS_NOME,
                    EMPRESAS_ENDERECO, 
                    EMPRESAS_NUMERO,
                    EMPRESAS_BAIRRO,
                    EMPRESAS_CEP,
                    EMPRESAS_CNAE,
                    CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
                    CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
                    PESSOAS.PESSOAS_FANTASIA,
                    PESSOAS.PESSOAS_NOME,
                    PESSOAS.PESSOAS_ENDERECO,
                    PESSOAS.PESSOAS_NUMERO,
                    PESSOAS.PESSOAS_BAIRRO,
                    PESSOAS.PESSOAS_CEP,                    
                    PESSOAS.PESSOAS_CPFCNPJ,
                    PESSOAS.PESSOAS_INSCRICAO,
                    PESSOAS.PESSOAS_TELEFONE,
                    PESSOAS.PESSOAS_EMAIL,
                    PESSOAS.PESSOAS_CELULAR,
                    PESSOAS.PESSOAS_PAGINA,
                    PESSOAS.PESSOAS_ID_CIDADES,
                    CIDADES.CIDADES_NOME,
                    CIDADES.CIDADES_ESTADO,
                    PRODUTOS_NOME,
                    PRODUTOS_BARRA,
                    SALDOS_CSTLOCAL, 
                    SALDOS_CSTOUTROS,
                    DOCUMENTOS_NOME,
                    DOCUMENTOS_LAYOUT,
                    DOCUMENTOS_ID_APLICACOES,
                    DOCUMENTOS_ALTERAPRECO,
                    APLICACOES_NOME
                from ORDENS 
                    left join PESSOAS    on PESSOAS_ID = ORDENS_ID_PESSOAS
                    left join EMPRESAS   on EMPRESAS_ID = ORDENS_ID_EMPRESAS
                    left join CIDADES    on CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADES
                    left join CIDADES    as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS_ID_CIDADES
                    left join PRODUTOS   on PRODUTOS_ID = ORDENS_IDSKY
                    left join SALDOS     on SALDOS_ID_EMPRESAS = ORDENS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                    left join DOCUMENTOS on DOCUMENTOS_ID = ORDENS_ID_DOCUMENTOS
                    left join APLICACOES on APLICACOES_ID = DOCUMENTOS_ID_APLICACOES
                ${sqlWhere} ${sqlOrder} `; 
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(results.map(async ordem => {
                const sqlProdutos = `select 
                    ORDENSPRODUTOS.*, 
                    PRODUTOS_NOME, 
                    PRODUTOS_MARCA, 
                    SALDOS_PRECO
                from ORDENSPRODUTOS
                left outer join PRODUTOS on PRODUTOS_ID = ORDENSPRODUTOS_ID_PRODUTOS
                left outer join SALDOS   on PRODUTOS_ID = SALDOS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = ${ordem['ORDENS_ID_EMPRESAS']}
                where ORDENSPRODUTOS_ID_ORDENS = ${ordem['ORDENS_ID']} 
                order by ORDENSPRODUTOS_ID`;

                ordem['ORDENS_PRODUTOSITENS'] = await samosFB.executeSQL(sqlProdutos, params);

                const sqlServicos = `select 
                    ORDENSSERVICOS.*, 
                    SERVICOS_NOME, 
                    SERVICOS_PRECO
                from ORDENSSERVICOS
                left outer join SERVICOS on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
                where ORDENSSERVICOS_ID_ORDENS = ${ordem['ORDENS_ID']}
                order by ORDENSSERVICOS_ID`;

                ordem['ORDENS_SERVICOSITENS'] = await samosFB.executeSQL(sqlServicos, params);
            }));

            return { 
                results, 
                total: results.length 
            };
        } catch(error) {
            const msg = 'Falha ao buscar ordens por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
    
    create: async (ordem, params) => {

        try {
            const { numero, serie } = await samosFB.ultimoDocto('ORDENS', ordem, params);

            ordem['ORDENS_NUMERO']      = numero;
            ordem['ORDENS_SERIE']       = serie;
            ordem['ORDENS_EMISSAO']     = moment.tz(params.timezone).format('YYYY-MM-DD');
            ordem['ORDENS_REFERENCIA']  = await referenciaOrdem(params);
            ordem['ORDENS_LOG']         = ordem['USUARIOS_LOGIN'] + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
            
            await samosFB.insert('ORDENS', ordem, params);

            (ordem['ORDENS_PRODUTOSITENS'] || []).forEach(produto => {
                produto['ORDENSPRODUTOS_ID_ORDENS'] = ordem['ORDENS_ID'];
            });

            (ordem['ORDENS_SERVICOSITENS'] || []).forEach(servico => {
                servico['ORDENSSERVICOS_ID_ORDENS'] = ordem['ORDENS_ID'];
            });

            try {
                if((ordem['ORDENS_PRODUTOSITENS'] || []).length > 0) {
                    await samosFB.insert('ORDENSPRODUTOS', ordem['ORDENS_PRODUTOSITENS'], params);
                }
                if((ordem['ORDENS_SERVICOSITENS'] || []).length > 0) {
                    await samosFB.insert('ORDENSSERVICOS', ordem['ORDENS_SERVICOSITENS'], params);
                }
            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from ORDENS         where ORDENS_ID                = ${ordem['ORDENS_ID']};
                        delete from ORDENSPRODUTOS where ORDENSPRODUTOS_ID_ORDENS = ${ordem['ORDENS_ID']};
                        delete from ORDENSSERVICOS where ORDENSSERVICOS_ID_ORDENS = ${ordem['ORDENS_ID']};
                    end
                `, params);

                throw error;
            }

            await utils.dblog(params);  

            return { results: ordem };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar ordem' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, ordem, params) => {
        const produtos = ordem['ORDENS_PRODUTOSITENS'] || [];
        const servicos = ordem['ORDENS_SERVICOSITENS'] || [];

        try {
            ordem['ORDENS_LOG'] = params.userName + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')

            await samosFB.update(id, 'ORDENS', ordem, params);

            const produtosOriginais = await samosFB.executeSQL(`select * from ORDENSPRODUTOS where ORDENSPRODUTOS_ID_ORDENS = ${id}`, params);
            await samosFB.executeSQL(`delete from ORDENSPRODUTOS where ORDENSPRODUTOS_ID_ORDENS = ${id}`, params);
        
            produtos.map(async item => item['ORDENSPRODUTOS_ID_ORDENS'] = id);

            await Promise.all(produtos);

            if(produtos.length > 0) {
                
                try {
                    await samosFB.insert('ORDENSPRODUTOS', produtos, params);
                } catch(error) {
                    if(produtosOriginais) {
                        await samosFB.insert('ORDENSPRODUTOS', produtosOriginais, params);
                    }

                    throw error;
                }
            }

            const servicosOriginais = await samosFB.executeSQL(`select * from ORDENSSERVICOS where ORDENSSERVICOS_ID_ORDENS = ${id}`, params);
            await samosFB.executeSQL(`delete from ORDENSSERVICOS where ORDENSSERVICOS_ID_ORDENS = ${id}`, params);
        
            servicos.map(async item => item['ORDENSSERVICOS_ID_ORDENS'] = id);
                
            await Promise.all(servicos);

            if(servicos.length > 0) {                

                try {
                    await samosFB.insert('ORDENSSERVICOS', servicos, params);
                } catch(error) {
                    if(servicosOriginais) {
                        await samosFB.insert('ORDENSSERVICOS', servicosOriginais, params);
                    }

                    throw error;
                }
            }
            
            await utils.dblog(params);
            return { results: ordem };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar ordem' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'ORDENS', params);
            await samosFB.delete(id, 'ORDENSPRODUTOS', 'ORDENS', params);
            await samosFB.delete(id, 'ORDENSSERVICOS', 'ORDENS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar ordem';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function referenciaOrdem(params) {
    const empresa = params.empresaLogada;
    const inicio = moment.tz(params.timezone).startOf('month').format('YYYY-MM-DD');         
    const final  = moment.tz(params.timezone).format('YYYY-MM-DD');
    const anoRef = moment.tz(params.timezone).format('YY');
    const mesatu = parseInt(moment.tz(params.timezone).format('MM')) - 1;
    const meses  = 'ABCDEFGHIJKL';
    const mesRef = meses.split('')[mesatu];

    const sql = `select (count(*) + 1) as REFERENCIA from ORDENS where ORDENS_ID_EMPRESAS = ${empresa} and 
                  ORDENS_EMISSAO between '${inicio}' and '${final}'`;
    
    const results = await samosFB.executeSQL(sql, params);

    const seq = results[0] ? ("000" + results[0]['REFERENCIA'].toString()).slice(-3) : '';
    const refFinal = anoRef + mesRef + seq;

    if(refFinal != '') {
        return refFinal;
    } else {
        throw 'Erro ao obter referencia da ordem'
    }
}