'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');

module.exports = {
    read: async (params) => {
        const {empresa,inicio,final} = params;

        try {
            const sqlSearch = `
                                execute block returns(codi_rev  varchar(20),
                                                    codi_fab  varchar(20),
                                                    codi_pro  varchar(20),
                                                    desc_pro  varchar(60),
                                                    ncmp_pro  varchar(8),
                                                    unid_pro  varchar(10),
                                                    barr_pro  varchar(14),
                                                    cind_pro  varchar(15),
                                                    date_pro  date,
                                                    lote_pro  varchar(20),
                                                    dven_pro  date,
                                                    qtde_pro  numeric(18,3),
                                                    qtdi_pro  numeric(18,3),
                                                    qtdt_pro  numeric(18,3))
                                as
                                declare variable V_SALDO      numeric (18,3);
                                declare variable V_QUANTIDADE numeric (18,3);
                                declare variable V_ESTOQUE    char(1);

                                begin
                                    for
                                    select cast(1 as varchar(20))         ,
                                            iif(trim(PRODUTOS_FABRICA)='','OUROFINO',PRODUTOS_FABRICA),
                                            cast(PRODUTOS_ID as varchar(20))    ,
                                            left(PRODUTOS_NOME,60)                              ,
                                            left(NCMS_NCM,8)                                    ,
                                            left(PRODUTOS_UNIDADE,10)                           ,
                                            left(PRODUTOS_BARRA,14)
                                    from PRODUTOS
                                    join NCMS       on NCMS_ID       = PRODUTOS_ID_NCMS
                                    join SALDOS     on SALDOS_ID_EMPRESAS = 1 and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                                    where  PRODUTOS_ID_PESSOAS = 9911473 
                                    into
                                        :codi_rev,
                                        :codi_fab,
                                        :codi_pro,
                                        :desc_pro,
                                        :ncmp_pro,
                                        :unid_pro,
                                        :barr_pro
                                    do
                                    begin
                                        cind_pro = '';
                                        date_pro = '${final}';
                                        lote_pro = '';
                                        dven_pro = '${final}';
                                        qtde_pro = 0;
                                        qtdi_pro = 0;
                                        qtdt_pro = 0;
                                        V_SALDO  = 0;
                                        for
                                          select OPERACOES_ESTOQUE, sum(MOVIMENTOSITENS_QUANTIDADE)
                                          from MOVIMENTOSITENS
                                               left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                                left outer join OPERACOES  on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                                           where MOVIMENTOSITENS_ID_PRODUTOS = cast(:codi_pro as Integer) and
                                                 MOVIMENTOS_ID_EMPRESAS = 1 and
                                                 ((MOVIMENTOS_ID_DOCUMENTOS = 10003 and MOVIMENTOS_EMISSAO <= '${final}' ) or
                                                 (MOVIMENTOS_ID_DOCUMENTOS = 10004 and MOVIMENTOS_ENTRADASAIDA <= '${final}') or
                                                 (MOVIMENTOS_ID_DOCUMENTOS = 10005 and MOVIMENTOS_ENTRADASAIDA <= '${final}'))
                                                 and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
                                                 and OPERACOES_ESTOQUE <> 'N'
                                        group by OPERACOES_ESTOQUE
                                        order by OPERACOES_ESTOQUE
                                        into :V_ESTOQUE, :V_QUANTIDADE
                                        do
                                        begin
                                        if (V_ESTOQUE = 'C') then
                                            V_SALDO = V_SALDO + V_QUANTIDADE;
                                        else if (V_ESTOQUE = 'D') then
                                            V_SALDO = V_SALDO - V_QUANTIDADE;
                                        end
                                        if (V_SALDO > 0) then
                                        qtde_pro = V_SALDO;
                                        suspend;
                                    end
                                end
                `;

            const results = await samosFB.executeSQL(sqlSearch, params);
                        
            const data = results.map(lowerCaseKeys);
            
            return data;            
            
        } catch(error) {
            const msg = 'Falha ao buscar stock';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }

        function lowerCaseKeys(obj) {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])
            );

        }

    }
};

