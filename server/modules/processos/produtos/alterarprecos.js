'use strict';

const api     = require('../..');
const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { grupo, fornecedor, empresa } = params;
            
            let sqlWhere = ` where PRODUTOS_ID > 0 and (PRODUTOS_STATUS = 'T' or PRODUTOS_STATUS = 'L') `;

            if(grupo) {
                sqlWhere += ` and PRODUTOS_ID_GRUPOS = '${grupo}' `
            }

            if(fornecedor) {
                sqlWhere += ` and PRODUTOS_ID_PESSOAS = '${fornecedor}' `
            }

            const sql = `select 
                PRODUTOS_ID,
                PRODUTOS_UNIDADE,
                PRODUTOS_NOME,
                PRODUTOS_MARCA,
                PRODUTOS_ID_GRUPOS,
                PRODUTOS_PESOLIQUIDO,
                GRUPOS_NOME,
                SALDOS_ID,
                SALDOS_ID_PRODUTOS,
                SALDOS_COMISSAO,
                SALDOS_MARKUP,
                SALDOS_CUSTO,
                SALDOS_MARGEM,
                SALDOS_MARGEMMINIMA,
                SALDOS_PRECO,
                SALDOS_PRAZO,
                SALDOS_PRECOMINIMO,
                0 as NOVO_COMISSAO,
                0 as NOVO_MARKUP,
                0 as NOVO_CUSTO,
                0 as NOVO_MARGEM,
                0 as NOVO_MARGEMMINIMA,
                0 as NOVO_PRECO,
                0 as NOVO_PRAZO,
                0 as NOVO_PRECOMINIMO
            from PRODUTOS
            join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
            join SALDOS on SALDOS_ID_PRODUTOS = PRODUTOS_ID and
                           SALDOS_ID_EMPRESAS = ${empresa}
            ${sqlWhere} 
            order by PRODUTOS_ID `;

            return { 
                results: await samosFB.executeSQL(sql, params)
            };
        } catch(error) {
            const msg = 'Falha ao buscar produtos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (produtos, params) => {
        try {
            const empresaPrecos = params.empresaLogada;
            const isMultiPrecos = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRECOS') : 'PRECOS'] == 'MULTIEMPRESA';
            
            async function updateList(intervaloInicial = 0) {
                const intervaloFinal = intervaloInicial + 128; // 256

                //console.log('i', intervaloInicial, 'f', intervaloFinal);

                const saldos = produtos.slice(intervaloInicial, intervaloFinal).map(produto => {
                    const saldo = {
                        'SALDOS_ID_PRODUTOS': produto['PRODUTOS_ID']
                    };
    
                    //so atualiza os campos se vierem do front
                    
                    if(produto['NOVO_COMISSAO'] >= 0) {
                        saldo['SALDOS_COMISSAO'] = produto['NOVO_COMISSAO'];
                    }
    
                    if(produto['NOVO_MARKUP'] >= 0) {
                        saldo['SALDOS_MARKUP'] = produto['NOVO_MARKUP'];
                    }
    
                    if(produto['NOVO_CUSTO'] >= 0) {
                        saldo['SALDOS_CUSTO'] = produto['NOVO_CUSTO'];
                    }
    
                    if(produto['NOVO_MARGEM'] >= 0) {
                        saldo['SALDOS_MARGEM'] = produto['NOVO_MARGEM'];
                    }
    
                    if(produto['NOVO_MARGEMMINIMA'] >= 0) {
                        saldo['SALDOS_MARGEMMINIMA'] = produto['NOVO_MARGEMMINIMA'];
                    }
    
                    if(produto['NOVO_PRAZO'] >= 0) {
                        saldo['SALDOS_PRAZO'] = produto['NOVO_PRAZO'];
                    }
    
                    if(produto['NOVO_PRECO'] >= 0) {
                        saldo['SALDOS_PRECO'] = produto['NOVO_PRECO'];

                        //Atualiza tambem o campo que é usado na pruden aço para o preço barra 
                        if(
                            params.client.toUpperCase().match(/PRUDENACO/) && 
                            produto['NOVO_TRANSFERENCIA'] >= 0 
                        ) {
                            saldo['SALDOS_TRANSFERENCIA'] = produto['NOVO_TRANSFERENCIA'];
                        }
                    }

                    // ALTERAR AQUI
                    
                    if(produto['NOVO_PRECOMINIMO'] >= 0) {
                        saldo['SALDOS_PRECOMINIMO'] = produto['NOVO_PRECOMINIMO'];
                    }
    
                    return saldo;
                });
        
                //await samosFB.update('SALDOS', saldos, params);
    
                let sql = 'execute block as begin ';

                const updates = await Promise.all(saldos.map(async model => {
                    return `update SALDOS set 
                        ${Object.keys(model).map(campo => {
                            return `${campo} = ${model[campo]}`
                        }).join(',')}
                    where SALDOS_ID_PRODUTOS = ${model[`SALDOS_ID_PRODUTOS`]}
                        ${ isMultiPrecos ? `` : ` and SALDOS_ID_EMPRESAS = ${empresaPrecos}` }`;
                }));
    
                sql += updates.join(';');
                sql += ';end';

                //console.log(sql);

                await samosFB.executeSQL(sql, params);

                if(produtos[intervaloFinal + 1]) {
                    return await updateList(intervaloFinal + 1);  // 256
                }
            }

            await updateList();
            await utils.dblog(params);

            if(params.client.toUpperCase().match(/PRUDENMOVEIS/)) {
                await gerarEtiquetas(produtos, params);
            }

            return { results: produtos };
        } catch(error) {
            const msg = 'Falha ao alterar produtos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const gerarEtiquetas = async (produtos, params) => {
    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
    const cents = utils.number.cents.bind(utils.number);
    const log  = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
    let itensGerar = produtos.filter(item => cents(item['NOVO_PRECO']) > 0);
    const isMultiPrecos = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRECOS') : 'PRECOS'] == 'MULTIEMPRESA';    
    const idsEmpresas = isMultiPrecos ? await getEmpresas(params) : params.empresaLogada;

    for(let i in itensGerar) {
        itensGerar[i]['ETIQUETASITENS_ID_PRODUTOS'] = itensGerar[i]['PRODUTOS_ID'];
        itensGerar[i]['ETIQUETASITENS_QUANTIDADE'] = 1;
    }

    for(let Emp in idsEmpresas) {

        const etiqueta = {
            'ETIQUETAS_ID'           : -1,
            'ETIQUETAS_ID_EMPRESAS'  : idsEmpresas[Emp],
            'ETIQUETAS_STATUS'       : 'F',
            'ETIQUETAS_NOME'         : 'ATUALIZACAO PRECOS ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss'),
            'ETIQUETAS_LOG'          : log,
            'ETIQUETAS_EMISSAO'      : hoje,
            'ETIQUETAS_LAYOUT'       : '',
            'TABELA'                 : 'PRODUTOS',
            'TIPO'                   : 'PRODUTOS',
            'ETIQUETAS_ITENS'        : itensGerar
        }
    
        await api.etiquetas().create(etiqueta, params);

    }

};

async function getEmpresas(params) {
    const sql = `select EMPRESAS_ID from EMPRESAS where EMPRESAS_STATUS = 'T'`;
    const results = await samosFB.executeSQL(sql, params)
    
    return (results || []).map(model => model['EMPRESAS_ID']);
};

