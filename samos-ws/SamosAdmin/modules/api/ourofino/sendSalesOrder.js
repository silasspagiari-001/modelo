'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');

module.exports = {
    read: async (params) => {

        const {empresa,inicio,final} = params;
        
        try {
            const sqlSearch = `
                                execute block returns( codi_ped varchar(20),
                                                    codi_rev varchar(20),
                                                    codi_fab varchar(20),
                                                    nume_ped varchar(20),
                                                    seri_ped varchar(20),
                                                    data_ped date,
                                                    datv_ped date,
                                                    datp_ped date,
                                                    stat_ped varchar(1),
                                                    codi_cli varchar(20),
                                                    muni_ped character(7),
                                                    codi_pro varchar(20),
                                                    desc_pro varchar(60),
                                                    ncmp_pro varchar(8),
                                                    unid_pro varchar(10),
                                                    barr_pro varchar(14),
                                                    cind_pro varchar(60),
                                                    lote_ivn varchar(20),
                                                    trib_ivn varchar(20),
                                                    pbru_ped numeric(18,4),
                                                    pliq_ped numeric(18,4),
                                                    qtde_ped numeric(18,3),
                                                    codi_ved varchar(20),
                                                    nome_ved varchar(60)
                                                    )
                                as
                                begin
                                    for
                                    select  MOVIMENTOS_ID                                       ,
                                            MOVIMENTOS_ID_EMPRESAS                              ,
                                            PRODUTOS_FABRICA                                    ,
                                            MOVIMENTOS_NUMERO                                   ,
                                            MOVIMENTOS_SERIE                                    ,
                                            MOVIMENTOS_EMISSAO                                  ,
                                            MOVIMENTOS_ENTRADASAIDA                             ,
                                            MOVIMENTOS_ENTRADASAIDA                             ,
                                            iif(MOVIMENTOS_STATUS='C','C','A')                  ,
                                            cast(MOVIMENTOS_ID_PESSOAS as varchar(20))          ,
                                            CIDADES_IBGE                                        ,
                                            cast(MOVIMENTOSITENS_ID_PRODUTOS as varchar(20))    ,
                                            left(PRODUTOS_NOME,60)                              ,
                                            left(NCMS_NCM,8)                                    ,
                                            left(PRODUTOS_UNIDADE,10)                           ,
                                            left(PRODUTOS_BARRA,14)                             ,
                                            ''                                                  ,
                                            ''                                                  ,
                                            ''                                                  ,
                                            (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ,
                                            MOVIMENTOSITENS_TOTAL                               ,
                                            MOVIMENTOSITENS_QUANTIDADE                          ,
                                            cast(MOVIMENTOS_ID_USUARIOS as varchar(20))         ,
                                            left(USUARIOS_NOME,60)
                                    from MOVIMENTOSITENS
                                    join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                    join OPERACOES  on OPERACOES_ID  = MOVIMENTOSITENS_ID_OPERACOES
                                    join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                                    join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                                    join CIDADES    on CIDADES_ID    = PESSOAS_ID_CIDADES
                                    join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
                                    join NCMS       on NCMS_ID       = PRODUTOS_ID_NCMS
                                    where MOVIMENTOS_ID_EMPRESAS =   ${empresa} and
                                            left(MOVIMENTOS_ID_OPERACOES,4) in ('5000') and
                                            MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                                            PRODUTOS_ID_PESSOAS =  9911473
                                    into
                                        :codi_ped,
                                        :codi_rev,
                                        :codi_fab,
                                        :nume_ped,
                                        :seri_ped,
                                        :data_ped,
                                        :datv_ped,
                                        :datp_ped,
                                        :stat_ped,
                                        :codi_cli,
                                        :muni_ped,
                                        :codi_pro,
                                        :desc_pro,
                                        :ncmp_pro,
                                        :unid_pro,
                                        :barr_pro,
                                        :cind_pro,
                                        :lote_ivn,
                                        :trib_ivn,
                                        :pbru_ped,
                                        :pliq_ped,
                                        :qtde_ped,
                                        :codi_ved,
                                        :nome_ved
                                    do
                                        begin
                                        suspend;
                                        end
                                end
                `;
        
            const results = await samosFB.executeSQL(sqlSearch, params);

            const data = results.map(lowerCaseKeys);
            
            return data;
            
        } catch(error) {
            const msg = 'Falha ao buscar Invoice';
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

