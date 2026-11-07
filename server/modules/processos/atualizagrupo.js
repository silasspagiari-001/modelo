'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    update: async (id, data, params) => {

        try {           
            const novoMargem = (data['markup'] / 100);
            const novoMinima = (data['margemmin'] / 100);
            const novoComissao = (data['comissao'] / 100);
            const novoPerprazo = (data['perprazo'] / 100);
            const sqlProduto = `update PRODUTOS set PRODUTOS_PESOLIQUIDO = ${novoMargem},
                                                    PRODUTOS_PESOBRUTO = ${novoMinima},
                                                    PRODUTOS_EMBALAGEM = ${novoPerprazo},
                                              where PRODUTOS_ID = ${id}`;
                                              
            // ALTERAR AQUI
            const sqlUpdate = `execute block returns (PRODUTOS_ID integer) as
                                    begin
                                        for
                                            select PRODUTOS_ID from PRODUTOS where PRODUTOS_ID_GRUPOS = ${id}
                                            into :PRODUTOS_ID
                                        do
                                            begin
                                                update SALDOS set SALDOS_MARGEM = ${novoMargem},
                                                                  SALDOS_MARGEMMINIMA = ${novoMinima}
                                                where SALDOS_ID_PRODUTOS = :PRODUTOS_ID;
                                                update SALDOS set SALDOS_PRECO = (ceil(((SALDOS_CUSTO + ((SALDOS_CUSTO * .01) * SALDOS_MARGEM))*.1))*10),
                                                                  SALDOS_PRECOMINIMO = round((SALDOS_CUSTO + ((SALDOS_CUSTO * 0.01) * SALDOS_MARGEMMINIMA)), 0),
                                                                  SALDOS_COMISSAO = ${novoComissao} where SALDOS_ID_PRODUTOS = :PRODUTOS_ID;
                                                update SALDOS set SALDOS_PRAZO = round((SALDOS_PRECO + ((SALDOS_PRECO * 0.01) * ${novoPerprazo})), 0)
                                                where SALDOS_ID_PRODUTOS = :PRODUTOS_ID;
                                                suspend;
                                            end
                                    end;`;

            await samosFB.executeSQL(sqlUpdate, params);
            await samosFB.executeSQL(sqlProduto, params);
        } catch(error) {
            const msg = error.message ? 'Falha ao atualizar grupo' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }

};