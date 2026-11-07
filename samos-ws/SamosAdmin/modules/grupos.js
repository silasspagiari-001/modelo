'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where GRUPOS_ID > 0  `;
                sqlWhere += status == 0 ? `and GRUPOS_STATUS = 'T' ` : status == 1 ? `and GRUPOS_STATUS = 'F' ` : '';

            let sqlSearch = '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and GRUPOS_ID = ${conteudo.replace(/\./ig,'')} `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and GRUPOS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by GRUPOS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and GRUPOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by GRUPOS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and GRUPOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by GRUPOS_ID ';  
                } else if(ordem == 3){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'GRUPOS',
                        chave: 'GRUPOS_ID',
                        campos: [
                            'GRUPOS_ID', 
                            'GRUPOS_NOME'
                        ]
                    }, params);

                    sqlWhere += `and GRUPOS_ID = '${id}' `;
                    sqlOrder = ' order by GRUPOS_ID '; 
                }
            }    

            const sqlCount  = `select count(*) from GRUPOS  ${sqlWhere}`;

            sqlSearch = `select ${limits} * from GRUPOS  ${sqlWhere} ${sqlOrder}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);

            if(params.client.toUpperCase().match(/PRUDENMOVEIS|EDULAR/) || params.userLogin == 'SUPERVISOR') {
                await Promise.all(results.map(async result => {
                    const sqlPercentuais = `
                            select  LOTES_QUANTIDADE  as SALDOS_MARGEM, 
                                    LOTES_SALDO       as SALDOS_MARGEMMINIMA, 
                                    LOTES_LOCALIZACAO as SALDOS_COMISSAO,
                                    LOTES_REFERENCIA  as SALDOS_ALIQUOTACFE 
                            from LOTES
                            where LOTES_ID = ${result['GRUPOS_ID']}`;        

                    const resPercentuais = await samosFB.executeSQL(sqlPercentuais, params) || [];

                    if(resPercentuais.length > 0) {
                        result['PERCENTUAL_MARGEM']       = resPercentuais[0]['SALDOS_MARGEM'];
                        result['PERCENTUAL_MARGEMMINIMA'] = resPercentuais[0]['SALDOS_MARGEMMINIMA'];
                        result['PERCENTUAL_COMISSAO']     = resPercentuais[0]['SALDOS_COMISSAO'];
                        result['PERCENTUAL_PRAZO']        = resPercentuais[0]['SALDOS_ALIQUOTACFE'];
                        result['PERCENTUAL_DESCVEN']      = params.descven;
                        result['PERCENTUAL_DESCSUP']      = params.descsup;
                        result['PERCENTUAL_DESCDIR']      = params.descdir;
                    } else {
                        result['PERCENTUAL_MARGEM']       = 0;
                        result['PERCENTUAL_MARGEMMINIMA'] = 0;
                        result['PERCENTUAL_COMISSAO']     = 0;
                        result['PERCENTUAL_PRAZO']        = 0;
                        result['PERCENTUAL_DESCVEN']      = 0;
                        result['PERCENTUAL_DESCSUP']      = 0;
                        result['PERCENTUAL_DESCDIR']      = 0;
                    }
                }))
            }
            
            return { results, total };
        } catch(error) {
            const msg = 'Falha ao buscar grupos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (grupo, params) => {

        try {
            await samosFB.insert('GRUPOS', grupo, params);
            await utils.dblog(params); 

            if(params.client.toUpperCase().match(/PRUDENMOVEIS|EDULAR/) || params.userLogin == 'SUPERVISOR') {
                let lote = {};
                const idLote = grupo['GRUPOS_ID'];
                lote['LOTES_ID']          = idLote;
                lote['LOTES_NOME']        = grupo['GRUPOS_NOME'];
                lote['LOTES_LOCALIZACAO'] = grupo['PERCENTUAL_COMISSAO'];
                lote['LOTES_QUANTIDADE']  = grupo['PERCENTUAL_MARGEM'];
                lote['LOTES_SALDO']       = grupo['PERCENTUAL_MARGEMMINIMA'];
                lote['LOTES_REFERENCIA']  = grupo['PERCENTUAL_PRAZO'];                

                await samosFB.update(idLote, 'LOTES', lote, params);
            }
            
            return { results: grupo };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar grupo' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, grupo, params) => {

        const cents = utils.number.cents.bind(utils.number);

        try {
            await samosFB.update(id, 'GRUPOS', grupo, params);
            await utils.dblog(params);

            if(params.client.toUpperCase().match(/PRUDENMOVEIS|EDULAR/) || params.userLogin == 'SUPERVISOR') {
                let lote = {};
                const idLote = grupo['GRUPOS_ID'];
                lote['LOTES_ID']          = idLote;
                lote['LOTES_NOME']        = grupo['GRUPOS_NOME'];
                lote['LOTES_LOCALIZACAO'] = grupo['PERCENTUAL_COMISSAO'];
                lote['LOTES_QUANTIDADE']  = grupo['PERCENTUAL_MARGEM'];
                lote['LOTES_SALDO']       = grupo['PERCENTUAL_MARGEMMINIMA'];
                lote['LOTES_REFERENCIA']  = grupo['PERCENTUAL_PRAZO'];

                await samosFB.update(idLote, 'LOTES', lote, params);

                const perCom = cents(grupo['PERCENTUAL_COMISSAO']);
                const perMar = cents(grupo['PERCENTUAL_MARGEM']);
                const perMmi = cents(grupo['PERCENTUAL_MARGEMMINIMA']);
                const perPrz = cents(grupo['PERCENTUAL_PRAZO']);

                if((perCom + perMar + perMmi + perPrz) > 0) {
                    await atualizaMargens(idLote, perCom, perMar, perMmi, perPrz, params);
                }
            }

            return { results: grupo };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar grupo' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'GRUPOS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar grupo';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const atualizaMargens = async function(idLote, perCom, perMar, perMmi, perPrz, params) {  // Atualiza margens/comissões por grupo

    let sqlUpdate = '';
// corrigir aqui pro ceil, aí vai ficar 100% ok
    sqlUpdate += perCom > 0 ? `SALDOS_COMISSAO = ${(perCom / 100)}, ` : '';
    sqlUpdate += perMar > 0 ? `SALDOS_MARGEM = ${(perMar / 100)}, ` : '';
    sqlUpdate += perMar > 0 ? `SALDOS_PRECO = round((SALDOS_CUSTO + (SALDOS_CUSTO * ${(perMar / 100)} * .01)), 0), ` : '';
    sqlUpdate += perMmi > 0 ? `SALDOS_MARGEMMINIMA = ${(perMmi / 100)}, ` : '';
    sqlUpdate += perMmi > 0 ? `SALDOS_PRECOMINIMO = round((SALDOS_CUSTO + (SALDOS_CUSTO * ${(perMmi / 100)} * .01)), 0), ` : '';
    sqlUpdate += perPrz > 0 ? `SALDOS_ALIQUOTACFE = ${(perPrz / 100)}, ` : '';
    sqlUpdate += perPrz > 0 ? `SALDOS_PRAZO = round((SALDOS_PRECO + (SALDOS_PRECO * ${(perPrz / 100)} * .01)), 0), ` : '';

    console.log('atualizaMargens');
    
    // ALTERAR AQUI

    let sqlMargem = sqlUpdate.slice(0, -2);
    
    const sqlMargens = ` execute block as declare variable V_PRODUTO integer;
                            begin
                                for
                                    select PRODUTOS_ID
                                    from PRODUTOS
                                    where PRODUTOS_ID_GRUPOS = ${idLote}
                                    into :V_PRODUTO
                                do
                                begin
                                    update SALDOS set ${sqlMargem}
                                    where SALDOS_ID_PRODUTOS = :V_PRODUTO;
                                end
                            end;`;
        try { 
            await samosFB.executeSQL(sqlMargens, params); 
        } catch(error) {
            //apenas lança o erro nos logs, não para a aplicação
            console.log(error);
        }

};
