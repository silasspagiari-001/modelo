'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');

module.exports = {
    read: async (params) => {
        const {empresa,inicio,final} = params
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
                                    select cast(MOVIMENTOS_ID_EMPRESAS as varchar(20))         ,
                                            PRODUTOS_FABRICA                                    ,
                                            cast(MOVIMENTOSITENS_ID_PRODUTOS as varchar(20))    ,
                                            left(PRODUTOS_NOME,60)                              ,
                                            left(NCMS_NCM,8)                                    ,
                                            left(PRODUTOS_UNIDADE,10)                           ,
                                            left(PRODUTOS_BARRA,14)
                                    from MOVIMENTOSITENS
                                    join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                    join OPERACOES  on OPERACOES_ID  = MOVIMENTOSITENS_ID_OPERACOES
                                    join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                                    join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                                    join CIDADES    on CIDADES_ID    = PESSOAS_ID_CIDADES
                                    join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
                                    join NCMS       on NCMS_ID       = PRODUTOS_ID_NCMS
                                    where MOVIMENTOS_ID_EMPRESAS =  ${empresa} and
				          left(MOVIMENTOS_ID_OPERACOES,4) in ('1102','1202','2202','5102','5202','6102','6202') and
                                          MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
				          PRODUTOS_ID_PESSOAS = 9912234
                                    group by cast(MOVIMENTOS_ID_EMPRESAS as varchar(20))         ,
                                            PRODUTOS_FABRICA                                    ,
                                            cast(MOVIMENTOSITENS_ID_PRODUTOS as varchar(20))    ,
                                            left(PRODUTOS_NOME,60)                              ,
                                            left(NCMS_NCM,8)                                    ,
                                            left(PRODUTOS_UNIDADE,10)                           ,
                                            left(PRODUTOS_BARRA,14)         
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
                        
            for(let i in results) {
                results[i] = lowerCaseKeys(results[i]);
            }

            return {
                results: results
            };
            
        } catch(error) {
            const msg = 'Falha ao buscar stock';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

function lowerCaseKeys(obj) {  
    if (!isObject(obj)) {
      throw new Error(`VocÃª deve enviar um objeto para a funÃ§Ã£o "lowerCaseKeys". Recebi "${typeof obj}"`)
    }
  
    return Object
      .entries(obj)
      .reduce((carry, [key, value]) => {
        carry[key.toLowerCase()] = value;
  
        return carry;
      }, {});
};

function isObject (value) {  
    return Object.prototype.toString.call(value) === '[object Object]'
};