'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');

module.exports = {
    read: async (params) => {
        const {empresa,inicio,final} = params;
 
        try {
            const sqlSearch =  `execute block returns(codi_ven varchar(20),
                                                      codi_rev varchar(20),
                                                      codi_fab varchar(20),
                                                      nume_ven varchar(20),
                                                      nume_ite varchar(20),
                                                      nref_ven varchar(20),
                                                      seri_ven varchar(20),
                                                      chav_ven varchar(50),
                                                      data_ven date,
                                                      datv_ven date,
                                                      orig_ven varchar(20),
                                                      oper_ven varchar(20),
                                                      desc_opr varchar(60),
                                                      sina_opr varchar(1),
                                                      cfop_ven varchar(4),
                                                      stat_ven varchar(1),
                                                      dest_ven varchar(14),
                                                      codi_cli varchar(20),
                                                      cnpj_cli varchar(14),
                                                      insc_cli varchar(20),
                                                      nome_cli varchar(65),
                                                      muni_cli character(7),
                                                      muni_ivn character(7),
                                                      codi_pro varchar(20),
                                                      desc_pro varchar(60),
                                                      unid_pro varchar(10),
                                                      ncmp_pro varchar(8),
                                                      barr_pro varchar(14),
                                                      lote_ivn varchar(20),
                                                      trib_ivn numeric(18,4),
                                                      pbru_ivn numeric(18,4),
                                                      pliq_ivn numeric(18,4),
                                                      qtde_ivn numeric(18,3),
                                                      codi_ved varchar(20),
                                                      nome_ved varchar(60),
                                                      nume_ped varchar(20),
                                                      fina_ven varchar(1),
                                                      cind_pro varchar(60)
                                                    )
                                    as
                                    declare variable  nroProduto Integer;
                                    declare variable  seqProduto Integer;
                                    begin
                                        for
                                        select  MOVIMENTOS_NUMERO                                         ,
                                                MOVIMENTOS_ID_EMPRESAS                                    ,
                                                iif(trim(PRODUTOS_FABRICA)='','OUROFINO',PRODUTOS_FABRICA),
                                                MOVIMENTOS_NUMERO                                         ,
                                                cast(MOVIMENTOSITENS_ID as varchar(20))                   ,
                                                ''                                                        ,
                                                substring(MOVIMENTOS_NFE from 23 for 3)                   ,
                                                MOVIMENTOS_NFE                                            ,
                                                MOVIMENTOS_EMISSAO                                        ,
                                                MOVIMENTOS_ENTRADASAIDA                                   ,
                                                ''                                                        ,
                                                Left(MOVIMENTOS_ID_OPERACOES,4)                           ,
                                                Left(OPERACOES_NOME,60)                                   ,
                                                case Left(MOVIMENTOSITENS_ID_OPERACOES,1)
                                                    when '1' then 'E'  -- Entrada
                                                    when '2' then 'E'  -- Entrada
                                                    when '5' then 'S'  -- Saida
                                                    when '6' then 'S'  -- Saida
                                                    else 'S'
                                                end                                                 ,
                                                Left(MOVIMENTOS_ID_OPERACOES,4)                     ,
                                                iif(MOVIMENTOS_STATUS='C','C','A')                  ,
                                                left(PESSOAS_CPFCNPJ,14)                            ,
                                                cast(MOVIMENTOS_ID_PESSOAS as varchar(20))          ,
                                                left(PESSOAS_CPFCNPJ,14)                            ,
                                                left(PESSOAS_INSCRICAO,15)                          ,
                                                left(PESSOAS_NOME,65)                               ,
                                                CIDADES_IBGE                                        ,
                                                CIDADES_IBGE                                        ,
                                                left(PRODUTOS_ID,10)                                ,
                                                left(PRODUTOS_NOME,60)                              ,
                                                left(PRODUTOS_UNIDADE,10)                           ,
                                                left(NCMS_NCM,8)                                    ,
                                                left(PRODUTOS_BARRA,14)                             ,
                                                ''                                                  ,
                                                coalesce((MOVIMENTOSITENS_VALORICMS   +
                                                MOVIMENTOSITENS_VALORIPI     +
                                                MOVIMENTOSITENS_VALORST      +
                                                MOVIMENTOSITENS_VALORPIS     +
                                                MOVIMENTOSITENS_VALORCOFINS),0)                     ,
                                                MOVIMENTOSITENS_TOTAL                               ,
                                                (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ,
                                                MOVIMENTOSITENS_QUANTIDADE                          ,
                                                cast(MOVIMENTOS_ID_USUARIOS as varchar(20))         ,
                                                left(USUARIOS_NOME,60)                              ,
                                                coalesce(MOVIMENTOS_NUMEROORIGEM,0)                 ,
                                                case coalesce(OPERACOES_FINALIDADE,'N')
                                                    when 'N' then '1'  -- Normal
                                                    when 'C' then '2'  -- Complementar
                                                    when 'A' then '3'  -- Ajuste
                                                    when 'D' then '4'  -- Devolucao
                                                    else '1'
                                                end,
                                                PRODUTOS_FABRICA                                                 
                                        from MOVIMENTOSITENS
                                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                        join OPERACOES  on OPERACOES_ID  = MOVIMENTOSITENS_ID_OPERACOES
                                        join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                                        join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                                        join CIDADES    on CIDADES_ID    = PESSOAS_ID_CIDADES
                                        join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
                                        join NCMS       on NCMS_ID       = PRODUTOS_ID_NCMS
                                        where MOVIMENTOS_ID_EMPRESAS =  ${empresa} and
					                        right(MOVIMENTOS_ID_DOCUMENTOS,5) in ('10003','10005') and
                                            MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                                            PRODUTOS_ID_PESSOAS =  9911473
                                        into
                                        :codi_ven,
                                        :codi_rev,
                                        :codi_fab,
                                        :nume_ven,
                                        :nume_ite,
                                        :nref_ven,
                                        :seri_ven,
                                        :chav_ven,
                                        :data_ven,
                                        :datv_ven,
                                        :orig_ven,
                                        :oper_ven,
                                        :desc_opr,
                                        :sina_opr,
                                        :cfop_ven,
                                        :stat_ven,
                                        :dest_ven,
                                        :codi_cli,
                                        :cnpj_cli,
                                        :insc_cli,
                                        :nome_cli,
                                        :muni_cli,
                                        :muni_ivn,
                                        :codi_pro,
                                        :desc_pro,
                                        :unid_pro,
                                        :ncmp_pro,
                                        :barr_pro,
                                        :lote_ivn,
                                        :trib_ivn,
                                        :pbru_ivn,
                                        :pliq_ivn,
                                        :qtde_ivn,
                                        :codi_ved,
                                        :nome_ved,
                                        :nume_ped,
                                        :fina_ven,
                                        :cind_pro                                        
                                        do
                                          begin
                                            seqProduto = 0;
                                            for
                                             select MOVIMENTOSITENS_ID_PRODUTOS From MOVIMENTOSITENS
                                             join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                             where MOVIMENTOS_NFE = :chav_ven
                                              order by MOVIMENTOSITENS_ID
                                            into
                                              :nroPRODUTO
                                            do
                                              begin
                                                seqProduto = seqProduto + 1;
                                                if (codi_pro = cast(nroPRODUTO as varchar(20))) then
                                                  nume_ite = cast(seqProduto as varchar(20));
                                              end
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