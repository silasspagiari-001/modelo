'use strict';

const utils   = require('../services/samosUtils');
const cents   = utils.number.cents.bind(utils.number);
const samosFB = require('../services/samosFB');
const api     = require('../modules');
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
            let sqlWhere = `where ORDENS_ID > 0 ${sqlEmpresa} and right(ORDENS_ID_DOCUMENTOS, 4) = '0007'`;
                
            if((numero || '').match(/,/) && numero.split(',').length > 0) {
                const numeros = numero.split(',');

                sqlWhere += ' and (';
                sqlWhere += numeros.reduce((str, num) => {
                    return `${str} ORDENS_NUMERO = ${num} or `;
                }, '').slice(0, -3);
                sqlWhere += ') ';

                sqlOrder = ` order by ORDENS_NUMERO `;    
            } else if(numero > 0) {
                sqlWhere += ` and ORDENS_NUMERO = ${numero}`;
                sqlOrder = ` order by ORDENS_NUMERO `;    
            } else if(numero != '') {
                sqlWhere += ` and ORDENS_REFERENCIA like '%${numero}%'`;
                sqlOrder = ` order by ORDENS_REFERENCIA `;    
            } else {
                if(pessoa > 0) {
                    sqlWhere += ` and ORDENS_ID_PESSOAS = '${pessoa}' `; 
                }

                if(ordem == 3) {
                    if (inicio && final && inicio.length > 0 && final.length > 0) {
                        sqlWhere += ` and ORDENS_REABERTURA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    }    
                } else {
                    if (inicio && final && inicio.length > 0 && final.length > 0) {
                        sqlWhere += ` and ORDENS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    }    
                }

                if (ordem == 1) {
                    sqlOrder = ` order by ORDENS_ID_PESSOAS, ORDENS_ID_EMPRESAS, ORDENS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by ORDENS_NUMERO `;
                } else if (ordem == 3) {
                    sqlOrder = ` order by ORDENS_REABERTURA, ORDENS_ID_EMPRESAS, ORDENS_ID `;
                } else {
                    sqlOrder = ` order by ORDENS_EMISSAO, ORDENS_ID_EMPRESAS, ORDENS_ID `;
                }

                if(status == 'X') {
                    sqlWhere += ` and ORDENS_STATUS not in ('N', 'F', 'C') `;
                } else {
                    if (status != 'T') {
                        sqlWhere += ` and ORDENS_STATUS = '${status}' `;
                    }    
                }
            }

            const sqlCount  = `select count(ORDENS_ID) from ORDENS ${sqlWhere}`;
                                    
            const sqlSearch = `
                select ${limits} 
                    ORDENS_ID,
                    ORDENS_ID_EMPRESAS,
                    ORDENS_ID_USUARIOS,
                    USUARIOS_NOME,
                    ORDENS_ID_PESSOAS,
                    ORDENS_NUMERO,
                    ORDENS_SERIE,
                    ORDENS_STATUS,
                    ORDENS_EMISSAO,
                    ORDENS_REABERTURA,
                    ORDENS_NOME,
                    ORDENS_CPFCNPJ,
                    ORDENS_CELULAR,
                    ORDENS_REFERENCIA,
                    ORDENS_SERVICOS,
                    ORDENS_TOTAL,
                    PESSOAS_FANTASIA,
                    CIDADES_NOME,
                    CIDADES_ESTADO,
                    ORDENSSERVICOS_DESCRITIVO,
                    SERVICOS_NOME
                from ORDENS 
                    left join ORDENSSERVICOS on ORDENSSERVICOS_ID_ORDENS = ORDENS_ID
                    left join SERVICOS       on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
                    left join PESSOAS  as PESSOAS on PESSOAS_ID = ORDENS_ID_PESSOAS
                    left join CIDADES  on CIDADES_ID = PESSOAS_ID_CIDADES
                    left join USUARIOS on USUARIOS_ID = ORDENS_ID_USUARIOS

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
                    PESSOAS.PESSOAS_CREDITO,
                    PESSOAS.PESSOAS_OBSERVACOES,
                    PESSOAS.PESSOAS_ID_CIDADES,
                    CIDADES.CIDADES_NOME,
                    CIDADES.CIDADES_ESTADO,
                    DOCUMENTOS_NOME,
                    DOCUMENTOS_LAYOUT,
                    DOCUMENTOS_ID_APLICACOES,
                    DOCUMENTOS_ID_PESSOAS,
                    DOCUMENTOS_ALTERAPRECO,
                    APLICACOES_NOME,
                    USUARIOS_NOME,
                    iif(ORDENS_TOTAL > 0, round(((ORDENS_DESCONTOS / ORDENS_TOTAL) * 100), 2), 0) as DESCONTO_PERCENTUAL
                from ORDENS 
                    left join PESSOAS    on PESSOAS_ID = ORDENS_ID_PESSOAS
                    left join EMPRESAS   on EMPRESAS_ID = ORDENS_ID_EMPRESAS
                    left join CIDADES    on CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADES
                    left join CIDADES    as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS_ID_CIDADES
                    left join USUARIOS   on USUARIOS_ID = ORDENS_ID_USUARIOS
                    left join DOCUMENTOS on DOCUMENTOS_ID = ORDENS_ID_DOCUMENTOS
                    left join APLICACOES on APLICACOES_ID = DOCUMENTOS_ID_APLICACOES
                ${sqlWhere} ${sqlOrder} `; 
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(results.map(async ordem => {
                ordem['ORDENS_ENDERECO'] = ordem['ORDENS_ENDERECO'].replace(/\\n/g, '\n');
                ordem['ORDENS_OBSERVACOES'] = ordem['ORDENS_OBSERVACOES'].replace(/\\n/g, '\n');

                const ordemPlano     = ordem['ORDENS_PLANO'].split('|') || [];

                ordem['SERVICO_COMPRIMENTO'] = ordemPlano[0];
                ordem['SERVICO_LARGURA']     = ordemPlano[1];
                ordem['SERVICO_ALTURA']      = ordemPlano[2];
                ordem['SERVICO_PESO']        = ordemPlano[3];

                const ordemRefeicoes = ordem['ORDENS_PERIODO'].split('|') || [];

                ordem['ALMOCO_INICIO'] = ordemRefeicoes[0];
                ordem['ALMOCO_FIM']    = ordemRefeicoes[1];
                ordem['JANTAR_INICIO'] = ordemRefeicoes[2];
                ordem['JANTAR_FIM']    = ordemRefeicoes[3];

                const sqlServicos = `select 
                    ORDENSSERVICOS.*, 
                    SERVICOS_NOME, 
                    SERVICOS_DESCRICAO,                    
                    SERVICOS_PRECO,
                    USUARIOS_LOGIN
                from ORDENSSERVICOS
                left outer join SERVICOS on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
                left outer join USUARIOS on USUARIOS_ID = ORDENSSERVICOS_ID_USUARIOS
                where ORDENSSERVICOS_ID_ORDENS = ${ordem['ORDENS_ID']}
                order by ORDENSSERVICOS_ID`;

                ordem['ORDENS_SERVICOSITENS'] = await samosFB.executeSQL(sqlServicos, params);  

                const servicos = ordem['ORDENS_SERVICOSITENS'];
                
                if(servicos.length > 0) { // Ajuste de campos
                    servicos.forEach(servico => {
                        servico['ITEM_NUMEROOS'] = ordem['ORDENS_NUMERO'];
                        const campoHoras = servico['ORDENSSERVICOS_DESCRITIVO'].split('|');
                         servico['ITEM_MINIMO']     = campoHoras[0];
                         servico['ITEM_HORALOCAL']  = campoHoras[1];
                         servico['ITEM_HORAINICIO'] = campoHoras[2];
                         servico['ITEM_HORAFIM']    = campoHoras[3];
                         servico['ITEM_TEMPO']      = campoHoras[4];
                         servico['ITEM_PREVISTO']   = campoHoras[5];
                    });    
                }                 

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
            ordem['ORDENS_LOG']         = ordem['USUARIOS_LOGIN'] + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
            ordem['ORDENS_PLANO']       = (ordem['SERVICO_COMPRIMENTO'] || '') + '|' +
                                          (ordem['SERVICO_LARGURA']     || '') + '|' +
                                          (ordem['SERVICO_ALTURA']      || '') + '|' +
                                          (ordem['SERVICO_PESO']        || '')

            ordem['ORDENS_PERIODO']     = (ordem['ALMOCO_INICIO'] || '') + '|' +
                                          (ordem['ALMOCO_FIM']    || '') + '|' +
                                          (ordem['JANTAR_INICIO'] || '') + '|' +
                                          (ordem['JANTAR_FIM']    || '')

            await samosFB.insert('ORDENS', ordem, params);

            (ordem['ORDENS_SERVICOSITENS'] || []).forEach(servico => {
                servico['ORDENSSERVICOS_ID_ORDENS'] = ordem['ORDENS_ID'];
                servico['ORDENSSERVICOS_QUANTIDADE'] = servico['ORDENSSERVICOS_QUANTIDADE'] || 0;
                servico['ORDENSSERVICOS_TOTAL']      = servico['ORDENSSERVICOS_TOTAL']      || 0;
                servico['ORDENSSERVICOS_DESCRITIVO'] = (servico['ITEM_MINIMO']     || '') + '|' +
                                                       (servico['ITEM_HORALOCAL']  || '') + '|' +
                                                       (servico['ITEM_HORAINICIO'] || '') + '|' +
                                                       (servico['ITEM_HORAFIM']    || '') + '|' +
                                                       (servico['ITEM_TEMPO']      || '') + '|' +                                                       
                                                       (servico['ITEM_PREVISTO']   || '');
            });

            await ratearDescontoPelosItens(ordem);//

            try {
                if((ordem['ORDENS_SERVICOSITENS'] || []).length > 0) {
                    await samosFB.insert('ORDENSSERVICOS', ordem['ORDENS_SERVICOSITENS'], params);
                }
            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from ORDENS         where ORDENS_ID                = ${ordem['ORDENS_ID']};
                        delete from ORDENSSERVICOS where ORDENSSERVICOS_ID_ORDENS = ${ordem['ORDENS_ID']};
                    end
                `, params);

                throw error;
            }

//          await gerarNotificacoesOrdem(ordem, params);

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

        const servicos = ordem['ORDENS_SERVICOSITENS'] || [];

        try {
            ordem['ORDENS_LOG'] = params.userName + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
            ordem['ORDENS_PLANO'] = (ordem['SERVICO_COMPRIMENTO'] || '') + '|' +
                                    (ordem['SERVICO_LARGURA']     || '') + '|' +
                                    (ordem['SERVICO_ALTURA']      || '') + '|' +
                                    (ordem['SERVICO_PESO']        || '');

            ordem['ORDENS_PERIODO'] = (ordem['ALMOCO_INICIO'] || '') + '|' +
                                      (ordem['ALMOCO_FIM']    || '') + '|' +
                                      (ordem['JANTAR_INICIO'] || '') + '|' +
                                      (ordem['JANTAR_FIM']    || '');
                 
            await samosFB.update(id, 'ORDENS', ordem, params);

            if((ordem['ORDENS_STATUS'] || '') == 'N' || cents(ordem['ORDENS_NUMEROORIGEM']) > 0) { 
                const idOrdem = ordem['ORDENS_ID'];
                const financeirosOriginais = await samosFB.executeSQL(`select * from FINANCEIROS where FINANCEIROS_ID_ORDENS = ${idOrdem}`, params);

                if(financeirosOriginais.length > 0) {
                    const sql = `execute block as
                    begin
                        delete from FINANCEIROS where FINANCEIROS_ID_ORDENS = ${idOrdem};
                    end;`;    
                    await samosFB.executeSQL(sql, params);                    
                }
            }
            
            if(servicos.length > 0) {
                await ratearDescontoPelosItens(ordem);
            }

            if(servicos.length > 0) {
                const servicosOriginais = await samosFB.executeSQL(`select * from ORDENSSERVICOS where ORDENSSERVICOS_ID_ORDENS = ${id}`, params);
                await samosFB.executeSQL(`delete from ORDENSSERVICOS where ORDENSSERVICOS_ID_ORDENS = ${id}`, params);
            
                servicos.map(item => {
                    item['ORDENSSERVICOS_ID_ORDENS'] = id
                    item['ORDENSSERVICOS_QUANTIDADE'] = item['ORDENSSERVICOS_QUANTIDADE'] || 0;
                    item['ORDENSSERVICOS_TOTAL']      = item['ORDENSSERVICOS_TOTAL']      || 0;
                    item['ORDENSSERVICOS_DESCRITIVO'] = (item['ITEM_MINIMO']  || '') + '|' +
                                                        (item['ITEM_HORALOCAL']  || '') + '|' +
                                                        (item['ITEM_HORAINICIO'] || '') + '|' +
                                                        (item['ITEM_HORAFIM']    || '') + '|' +
                                                        (item['ITEM_TEMPO']      || '') + '|' +
                                                        (item['ITEM_PREVISTO']      || '');                
                });
                
                try {
                    await samosFB.insert('ORDENSSERVICOS', ordem['ORDENS_SERVICOSITENS'], params);
                } catch(error) {
                    if(servicosOriginais) {
                        await samosFB.insert('ORDENSSERVICOS', servicosOriginais, params);
                    }

                    throw error;
                }
            }

            await removerNotificacoesOrdem(ordem['ORDENS_NUMERO'], ordem['ORDENS_SERIE'], params);
//          await gerarNotificacoesOrdem(ordem, params);
            
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
            const sql = `execute block as
                begin
                    delete from ORDENS where ORDENS_ID                   = ${id};
                    delete from ORDENSSERVICOS where ORDENSSERVICOS_ID_ORDENS = ${id};
                    delete from FINANCEIROS    where FINANCEIROS_ID_ORDENS    = ${id};
                end;`;
                
            await samosFB.executeSQL(sql, params);

            await removerNotificacoesOrdem(params.numeroos, params.serieos, params);

            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar ordem';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const ratearDescontoPelosItens = async function(ordem) {

    const servicos = ordem['ORDENS_SERVICOSITENS'] || [];

    const totalDesconto = cents(ordem['ORDENS_DESCONTOS']);
    const totalServicos = cents(ordem['ORDENS_SERVICOS']);

    const descontoPercentual = Math.round(((totalDesconto / totalServicos) * 100), 2) || 0;

    let somaDescontos = 0

    if(servicos.length > 0) {
        servicos.forEach(servico => {
            const totalItem = cents(servico['ORDENSSERVICOS_TOTAL']);
            const descontoItem = Math.round((totalItem * (descontoPercentual / 100)), 2);
    
            servico['ORDENSSERVICOS_DESCONTOS'] = (descontoItem / 100);
            somaDescontos += descontoItem;
        });    
    }

    if(somaDescontos > totalDesconto) { // sobra
        const diferenca = (somaDescontos - totalDesconto);
        servicos[0]['ORDENSSERVICOS_DESCONTOS'] = (servicos[0]['ORDENSSERVICOS_DESCONTOS'] - (diferenca / 100));
    } else if(somaDescontos < totalDesconto) { // falta
        const diferenca = (totalDesconto - somaDescontos);
        servicos[0]['ORDENSSERVICOS_DESCONTOS'] = (servicos[0]['ORDENSSERVICOS_DESCONTOS'] + (diferenca / 100));
    }
};

async function gerarNotificacoesOrdem(ordem, params) {

    const itemOrdem = ordem['ORDENS_SERVICOSITENS'][0];

    const dataAgenda = (itemOrdem['ORDENSSERVICOS_DESCRITIVO'] || []).split('|')[0];
    const horaAgenda = (itemOrdem['ORDENSSERVICOS_DESCRITIVO'] || []).split('|')[2];
    const nomeVeiculo = itemOrdem['SERVICOS_NOME'] || '';
    const assunto     = `${ordem['ORDENS_NUMERO']}|${ordem['ORDENS_SERIE']}|${nomeVeiculo} - ${ordem['ORDENS_NOME']}`;
    const mensagem    = `${ordem['ORDENS_NUMERO']} ${ordem['ORDENS_SERIE']} - ${nomeVeiculo} - ${ordem['ORDENS_NOME']}`;

    const notificacao = {
        'NOTIFICACAO_TODOS'      : 'T',
        'NOTIFICACAO_SMS'        : 'F',
        'NOTIFICACAO_ID_USUARIOS': 11,
        'NOTIFICACAO_ID_DESTINO' : 11,
        'NOTIFICACAO_NOME'       : assunto.slice(0, 50),
        'NOTIFICACAO_HORACRIACAO': moment.tz(params.timezone).format('HH:mm'),
        'NOTIFICACAO_DATAAVISAR' : dataAgenda,
        'NOTIFICACAO_HORAAVISAR' : horaAgenda,
        'NOTIFICACAO_MENSAGEM'   : mensagem
    }

    await api.notificacao().create(notificacao, params);    

};

async function removerNotificacoesOrdem(numero, serie, params) {

    await samosFB.executeSQL(`delete from NOTIFICACAO where NOTIFICACAO_NOME like '${numero}|${serie}|%'`, params);

};
