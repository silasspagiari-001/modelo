'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { produtos, promocao, empresas, inicio, final } = params;
            const listaEmpresasChecar = (empresas || '').split('|');
            const listaIdsProduto = (produtos || '').split(',');

            const sqlProdutos = listaIdsProduto.reduce((sql, id) => {
                return sql += `
                    PROMOCOESITENS_ID_PRODUTOS = '${id}' or `;
            }, '').slice(0, -3)

            const sqlSearch = `select
                      PROMOCOES_ID,
                      PROMOCOES_EMPRESAS,
                      PROMOCOESITENS_ID_PRODUTOS
                from  PROMOCOESITENS
                join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                where PROMOCOES_ID      <> ${promocao} and
                      PROMOCOES_STATUS  = 'T' and
                      PROMOCOES_VALIDADE >= '${inicio.replace (/\//ig,'.')}' and
                      PROMOCOES_EMISSAO  <= '${final.replace (/\//ig,'.')}' and (
                      ${sqlProdutos}
                )`;

            const results = await samosFB.executeSQL(sqlSearch, params);

            const filtered = (results || []).filter(promocao => {
                const listaEmpresas = (promocao['PROMOCOES_EMPRESAS'] || '').split('|');
                const result = listaEmpresasChecar.filter(empresa => {
                    return listaEmpresas.includes(empresa);
                });
                
                return result.length > 0;
            });

            return { 
                results: filtered, 
                total: filtered.length
            };
        } catch(error) {
            const msg = 'Falha ao consultar produto em promoção';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};