'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');

module.exports = {
    read: async (params) => {
        const {empresa,inicio,final} = params
        // console.log(params);
        try {
            const sqlSearch = `
                                execute block returns(codi_ven varchar(20),
                                                        codi_rev varchar(20),
                                                        codi_fab varchar(20),
                                                        modl_ven varchar(02),
                                                        nume_ven varchar(20),
                                                        orig_ven varchar(20),
                                                        seri_ven varchar(20),
                                                        fina_ven varchar(01),
                                                        data_ven date,
                                                        oper_ven varchar(20),
                                                        cfop_ven varchar(4),
                                                        desc_opr varchar(60),
                                                        stat_ven varchar(1),
                                                        sina_opr varchar(1),
                                                        codi_cli varchar(20),
                                                        cnpj_cli varchar(14),
                                                        nome_cli varchar(65),
                                                        cepc_cli varchar(9),
                                                        muni_cli character(7),
                                                        dest_ven varchar(14),
                                                        muni_ivn varchar(7),
                                                        codi_pro varchar(20),
                                                        desc_pro varchar(60),
                                                        ncmp_pro varchar(8),
                                                        unid_pro varchar(10),
                                                        barr_pro varchar(14),
                                                        cind_pro varchar(15),
                                                        lote_ivn varchar(20),
                                                        pbru_ivn numeric(18,4),
                                                        pliq_ivn numeric(18,4),
                                                        trib_ivn numeric(18,4),
                                                        qtde_ivn numeric(18,3),
                                                        codi_ved varchar(20),
                                                        nome_ved varchar(60))
                                as
                                begin
                                    for
                                    select MOVIMENTOS_ID_USUARIOS                              ,
                                            MOVIMENTOS_ID_EMPRESAS                              ,
                                            PRODUTOS_FABRICA                                    ,
                                            substring(MOVIMENTOS_NFE from 21 for 2)             ,
                                            cast(MOVIMENTOS_ID_USUARIOS as varchar(20))         ,
                                            ''                                                  ,
                                            substring(MOVIMENTOS_NFE from 23 for 3)             ,
                                            case OPERACOES_FINALIDADE
                                                when 'C' then '2'  -- Complementar
                                                when 'D' then '4'  -- Devolucao
                                                when 'A' then '3'  -- Ajuste
                                                else '1'           -- Normal
                                            end                                                 ,
                                            MOVIMENTOS_EMISSAO                                  ,
                                            cast(MOVIMENTOS_ID as varchar(20))                  ,
                                            Left(MOVIMENTOS_ID_OPERACOES,4)                     ,
                                            Left(OPERACOES_NOME,60)                             ,
                                            iif(MOVIMENTOS_STATUS='C','C','A')                  ,
                                            case Left(MOVIMENTOSITENS_ID_OPERACOES,1)
                                                when '1' then 'E'  -- Entrada
                                                when '2' then 'E'  -- Entrada
                                                when '5' then 'S'  -- Saida
                                                when '6' then 'S'  -- Saida
                                                else 'S'
                                            end                                                 ,
                                            cast(MOVIMENTOS_ID_PESSOAS as varchar(20))          ,
                                            left(PESSOAS_CPFCNPJ,14)                            ,
                                            left(PESSOAS_NOME,65)                               ,
                                            PESSOAS_CEP                                         ,
                                            CIDADES_IBGE                                        ,
                                            PESSOAS_CPFCNPJ                                     ,
                                            CIDADES_IBGE                                        ,
                                            cast(MOVIMENTOSITENS_ID_PRODUTOS as varchar(20))    ,
                                            left(PRODUTOS_NOME,60)                              ,
                                            left(NCMS_NCM,8)                                    ,
                                            left(PRODUTOS_UNIDADE,10)                           ,
                                            left(PRODUTOS_BARRA,14)                             ,
                                            Left('',15)                                         ,
                                            Left('',20)                                         ,
                                            MOVIMENTOSITENS_PRECO                               ,
                                            (MOVIMENTOSITENS_TOTAL / MOVIMENTOSITENS_QUANTIDADE),
                                            (MOVIMENTOSITENS_TOTAL      +
                                            MOVIMENTOSITENS_VALORICMS   +
                                            MOVIMENTOSITENS_VALORIPI    +
                                            MOVIMENTOSITENS_VALORST     +
                                            MOVIMENTOSITENS_VALORPIS    +
                                            MOVIMENTOSITENS_VALORCOFINS +
                                            MOVIMENTOSITENS_FRETE       +
                                            MOVIMENTOSITENS_SEGURO      +
                                            MOVIMENTOSITENS_DESPESAS)  ,
                                            MOVIMENTOSITENS_QUANTIDADE ,
                                            MOVIMENTOS_ID_USUARIOS     ,
                                            left(USUARIOS_LOGIN,60)
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
				          PRODUTOS_ID_PESSOAS =  9912234
                                    into
                                        :codi_ven,
                                        :codi_rev,
                                        :codi_fab,
                                        :modl_ven,
                                        :nume_ven,
                                        :orig_ven,
                                        :seri_ven,
                                        :fina_ven,
                                        :data_ven,
                                        :oper_ven,
                                        :cfop_ven,
                                        :desc_opr,
                                        :stat_ven,
                                        :sina_opr,
                                        :codi_cli,
                                        :cnpj_cli,
                                        :nome_cli,
                                        :cepc_cli,
                                        :muni_cli,
                                        :dest_ven,
                                        :muni_ivn,
                                        :codi_pro,
                                        :desc_pro,
                                        :ncmp_pro,
                                        :unid_pro,
                                        :barr_pro,
                                        :cind_pro,
                                        :lote_ivn,
                                        :pbru_ivn,
                                        :pliq_ivn,
                                        :trib_ivn,
                                        :qtde_ivn,
                                        :codi_ved,
                                        :nome_ved
                                    do
                                    begin
                                        suspend;
                                    end
                                end                
                `;
        
            const results = await samosFB.executeSQL(sqlSearch, params);

            console.log(results);
            
            for(let i in results) {
                results[i] = lowerCaseKeys(results[i]);
            }

            return {
                results: results
            };
            
        } catch(error) {
            const msg = 'Falha ao buscar Invoice';
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