'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');

module.exports = {
    read: async (params) => {
        const {empresa,inicio,final} = params;

        try {
            const sqlSearch = `
                                execute block
                                returns (
                                    codi_rev varchar(20),
                                    mes_ven  integer,
                                    ano_ven  integer,
                                    oper_ven varchar(20),
                                    cfop_ven varchar(4),
                                    desc_opr varchar(60),
                                    ncmp_pro varchar(8),
                                    sina_opr varchar(1),
                                    valf_ven numeric(18,4),
                                    volf_ven numeric(18,4),
                                    volu_ven numeric(18,4),
                                    volr_ven numeric(18,4)
                                )
                                as
                                begin

                                for
                                    select
                                        cast(movimentos_id_empresas as varchar(20)),
                                        extract(month from movimentos_emissao),
                                        extract(year  from movimentos_emissao),
                                        left(operacoes_id,4),
                                        operacoes_nome,
                                        ncms_ncm,
                                        operacoes_tipo,
                                        sum(movimentos_total - movimentos_descontos),
                                        sum(movimentositens_quantidade)
                                    from movimentositens
                                        join MOVIMENTOS  on movimentos_id = MOVIMENTOSITENS_ID_MOVIMENTOS
                                        join OPERACOES   on operacoes_id  = MOVIMENTOSITENS_ID_OPERACOES
                                        join PRODUTOS    on produtos_id   = MOVIMENTOSITENS_ID_PRODUTOS
                                        join ncms        on NCMS_ID       = PRODUTOS_ID_NCMS
                                    where MOVIMENTOS_ID_EMPRESAS          = ${empresa}                     and
     					                right(MOVIMENTOS_ID_DOCUMENTOS,5) in ('10003','10005') and
                                        MOVIMENTOS_EMISSAO between      '${inicio}' and date '${final}' and
                                        MOVIMENTOS_STATUS               <> 'C' and
                                        PRODUTOS_ID_PESSOAS              = 9911473
                                    group by
                                        MOVIMENTOS_ID_EMPRESAS,
                                        extract(month from MOVIMENTOS_EMISSAO),
                                        extract(year  from MOVIMENTOS_EMISSAO),
                                        OPERACOES_ID,
                                        OPERACOES_NOME,
                                        NCMS_NCM,
                                        OPERACOES_TIPO
                                    into
                                        :codi_rev,
                                        :mes_ven,
                                        :ano_ven,
                                        :oper_ven,
                                        :desc_opr,
                                        :ncmp_pro,
                                        :sina_opr,
                                        :volu_ven,
                                        :volr_ven                                        
                                do
                                    begin
                                        cfop_ven = left(oper_ven,4);
                                        volf_ven = 0;
                                        valf_ven = 0;
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