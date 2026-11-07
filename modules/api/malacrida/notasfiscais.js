'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const fs      = require('fs');

module.exports = {
    read: async (params) => {
        let {filial,tipo,status,emissaoinicial,emissaofinal, page,  limit } = params;

        let data = {};

        const limits = (page >= 0 && limit >= 0) ? `first ${limit} skip ${page} ` : '';
        
        let sqlWhere = ` where MOVIMENTOS_ID > 0 `;

        if (filial !== '') {
          sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = '${filial}' `;            
        }
        if (tipo !== '') {
          if(tipo === 'S') {
            sqlWhere += ` and right(MOVIMENTOS_ID_DOCUMENTOS,2) = '03' `;            
          } else {
            sqlWhere += ` and right(MOVIMENTOS_ID_DOCUMENTOS,2) = '05' `;            
          }
        }
        if (status !== '') {
          sqlWhere += ` and MOVIMENTOS_STATUS = '${status}' `;     
        }
        if (emissaoinicial !== '') {
          if (emissaofinal === '') {
            emissaofinal = emissaoinicial;
          }
          sqlWhere += ` and MOVIMENTOS_EMISSAO between '${emissaoinicial}' and '${emissaofinal}' `;     
        }

        try {
            const sqlMovimentos = `
                                execute block returns(MOVIMENTOS_ID            integer,
                                                      EMPRESAS_CPFCNPJ         varchar(15),
                                                      EMPRESAS_FANTASIA        varchar(50),
                                                      MOVIMENTOS_STATUS        varchar(1),
                                                      MOVIMENTOS_NUMERO        varchar(15),
                                                      MOVIMENTOS_SERIE         varchar(50),
                                                      MOVIMENTOS_EMISSAO       date,
                                                      MOVIMENTOS_PRODUTOS      numeric(12,2),
                                                      MOVIMENTOS_PERCENTUAL    numeric(7,3),
                                                      MOVIMENTOS_DESCONTOS     numeric(12,2),
                                                      MOVIMENTOS_MARGEM        numeric(7,3),
                                                      MOVIMENTOS_TOTAL         numeric(12,2),
                                                      MOVIMENTOS_BASEICMS      numeric(12,2),
                                                      MOVIMENTOS_VALORICMS     numeric(12,2),
                                                      MOVIMENTOS_BASEST        numeric(12,2),
                                                      MOVIMENTOS_VALORST       numeric(12,2),
                                                      MOVIMENTOS_VALORIPI      numeric(12,2),
                                                      MOVIMENTOS_FRETE         numeric(12,2),
                                                      MOVIMENTOS_SEGURO        numeric(12,2),
                                                      MOVIMENTOS_DESPESAS      numeric(12,2),
                                                      MOVIMENTOS_NFE           varchar(50),
                                                      MOVIMENTOS_PROTOCOLO     varchar(15),
                                                      USUARIOS_NOME            varchar(50),
                                                      MOVIMENTOS_ID_DOCUMENTOS integer,
                                                      MOVIMENTOS_ID_OPERACOES  integer,
                                                      OPERACOES_NOME           varchar(50),                  
                                                      PRAZOS_NOME              varchar(50),                  
                                                      PRAZOS_PARCELAS          integer,                  
                                                      PESSOAS_CPFCNPJ          varchar(15),
                                                      PESSOAS_NOME             varchar(50),
                                                      PESSOAS_CEP              varchar(8),
                                                      PESSOAS_ENDERECO         varchar(50),
                                                      PESSOAS_NUMERO           varchar(10),
                                                      PESSOAS_BAIRRO           varchar(50),
                                                      CIDADES_NOME             varchar(50),
                                                      CIDADES_ESTADO           varchar(2)
                                                      )
                                as
                                begin
                                  for
                                    select ${limits}
                                                          MOVIMENTOS_ID,
                                                          EMPRESAS_CPFCNPJ,
                                                          EMPRESAS_FANTASIA,
                                                          MOVIMENTOS_STATUS,
                                                          MOVIMENTOS_NUMERO,
                                                          MOVIMENTOS_SERIE,
                                                          MOVIMENTOS_EMISSAO,
                                                          MOVIMENTOS_PRODUTOS,
                                                          MOVIMENTOS_PERCENTUAL,
                                                          MOVIMENTOS_DESCONTOS,
                                                          MOVIMENTOS_MARGEM,
                                                          MOVIMENTOS_TOTAL,
                                                          MOVIMENTOS_BASEICMS,
                                                          MOVIMENTOS_VALORICMS,
                                                          MOVIMENTOS_BASEST,
                                                          MOVIMENTOS_VALORST,
                                                          MOVIMENTOS_VALORIPI,
                                                          MOVIMENTOS_FRETE,
                                                          MOVIMENTOS_SEGURO,
                                                          MOVIMENTOS_DESPESAS,
                                                          MOVIMENTOS_NFE,
                                                          MOVIMENTOS_PROTOCOLO,
                                                          MOVIMENTOS_ID_DOCUMENTOS,
                                                          MOVIMENTOS_ID_OPERACOES,
                                                          OPERACOES_NOME,
                                                          PRAZOS_NOME,
                                                          PRAZOS_PARCELAS,
                                                          USUARIOS_NOME,
                                                          PESSOAS_CPFCNPJ,
                                                          PESSOAS_NOME,
                                                          PESSOAS_CEP,
                                                          PESSOAS_ENDERECO,
                                                          PESSOAS_NUMERO,
                                                          PESSOAS_BAIRRO,
                                                          CIDADES_NOME,
                                                          CIDADES_ESTADO
                                      from MOVIMENTOS
                                      join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
                                      join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                      join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                      join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                                      join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                                      join PRAZOS on PRAZOS_ID = MOVIMENTOS_ID_PRAZOS
                                      ${sqlWhere} 
                                      order by MOVIMENTOS_ID
                                      into
                                          MOVIMENTOS_ID,  
                                          EMPRESAS_CPFCNPJ,
                                          EMPRESAS_FANTASIA,
                                          MOVIMENTOS_STATUS,
                                          MOVIMENTOS_NUMERO,
                                          MOVIMENTOS_SERIE,
                                          MOVIMENTOS_EMISSAO,
                                          MOVIMENTOS_PRODUTOS,
                                          MOVIMENTOS_PERCENTUAL,
                                          MOVIMENTOS_DESCONTOS,
                                          MOVIMENTOS_MARGEM,
                                          MOVIMENTOS_TOTAL,
                                          MOVIMENTOS_BASEICMS,
                                          MOVIMENTOS_VALORICMS,
                                          MOVIMENTOS_BASEST,
                                          MOVIMENTOS_VALORST,
                                          MOVIMENTOS_VALORIPI,
                                          MOVIMENTOS_FRETE,
                                          MOVIMENTOS_SEGURO,
                                          MOVIMENTOS_DESPESAS,
                                          MOVIMENTOS_NFE,
                                          MOVIMENTOS_PROTOCOLO,
                                          MOVIMENTOS_ID_DOCUMENTOS,
                                          MOVIMENTOS_ID_OPERACOES,
                                          OPERACOES_NOME,
                                          PRAZOS_NOME,
                                          PRAZOS_PARCELAS,
                                          USUARIOS_NOME,
                                          PESSOAS_CPFCNPJ,
                                          PESSOAS_NOME,
                                          PESSOAS_CEP,
                                          PESSOAS_ENDERECO,
                                          PESSOAS_NUMERO,
                                          PESSOAS_BAIRRO,
                                          CIDADES_NOME,
                                          CIDADES_ESTADO
                                      do
                                          begin
                                            suspend;
                                          end
                                  end
                            `;
            
            const movimentos = await samosFB.executeSQL(sqlMovimentos, params);
            
            let total     = movimentos.length;

            if(movimentos.length > 0) {
                data.movimentos = [];
                for(let itens in movimentos) {
                    const sqlMovimentosItens = `execute block returns(
                                                                       id                        integer,
                                                                       cfop                      varchar(4),
                                                                       pruduto                   integer,
                                                                       descricao                 varchar(50),
                                                                       unidade                   varchar(03),
                                                                       sku                       varchar(15),
                                                                       ncm                       varchar(10),
                                                                       quantidade                numeric(12,3),
                                                                       preco                     numeric(14,4),
                                                                       custo                     numeric(12,2),
                                                                       percentualDesconto        numeric(7,3),
                                                                       valorDesconto             numeric(12,2),
                                                                       total                     numeric(12,2),
                                                                       aliquotaIcms              numeric(5,2),
                                                                       baseIcms                  numeric(12,2),
                                                                       valorIcms                 numeric(12,2),
                                                                       aliquotaIpi               numeric(5,2),
                                                                       valorIpi                  numeric(12,2),
                                                                       baseSubstituicao          numeric(12,2),
                                                                       icmsSubstituicao          numeric(7,3),
                                                                       valorSubstituicao         numeric(12,2),
                                                                       frete                     numeric(12,2),
                                                                       seguro                    numeric(12,2),
                                                                       despesas                  numeric(12,2),
                                                                       situacaoTributaria        varchar(4),
                                                                       situacaoTributariaPis     varchar(2),
                                                                       aliquotaPis               numeric(7,3),
                                                                       basePis                   numeric(12,2),
                                                                       valorPis                  numeric(12,2),
                                                                       varloPisSusbstituicao     numeric(12,2),
                                                                       cstCofins                 varchar(2),
                                                                       aliquotaCofins            numeric(7,3),
                                                                       baseCofins                numeric(12,2),
                                                                       valorCofins               numeric(12,2),
                                                                       valorCofinsSubstituicao   numeric(12,2),
                                                                       margem                    numeric(7,3)
                                                                      )
                                            as
                                              begin
                                                for
                                                  select
                                                        MOVIMENTOSITENS_ID,
                                                        left(MOVIMENTOSITENS_ID_OPERACOES,4),
                                                        MOVIMENTOSITENS_ID_PRODUTOS,
                                                        PRODUTOS_NOME,
                                                        PRODUTOS_UNIDADE,
                                                        PRODUTOS_BARRA,
                                                        NCMS_NCM,
                                                        MOVIMENTOSITENS_QUANTIDADE,
                                                        MOVIMENTOSITENS_PRECO,
                                                        MOVIMENTOSITENS_CUSTO,
                                                        MOVIMENTOSITENS_PERCENTUAL,
                                                        MOVIMENTOSITENS_DESCONTOS,
                                                        MOVIMENTOSITENS_TOTAL,
                                                        MOVIMENTOSITENS_ICMS,
                                                        MOVIMENTOSITENS_BASEICMS,
                                                        MOVIMENTOSITENS_VALORICMS,
                                                        MOVIMENTOSITENS_IPI,
                                                        MOVIMENTOSITENS_VALORIPI,
                                                        MOVIMENTOSITENS_BASEST,
                                                        MOVIMENTOSITENS_ICMSST,
                                                        MOVIMENTOSITENS_VALORST,
                                                        MOVIMENTOSITENS_FRETE,
                                                        MOVIMENTOSITENS_SEGURO,
                                                        MOVIMENTOSITENS_DESPESAS,
                                                        MOVIMENTOSITENS_CST,
                                                        MOVIMENTOSITENS_CSTPIS,
                                                        MOVIMENTOSITENS_ALIQUOTAPIS,
                                                        MOVIMENTOSITENS_BASEPIS,
                                                        MOVIMENTOSITENS_VALORPIS,
                                                        MOVIMENTOSITENS_VALORPISST,
                                                        MOVIMENTOSITENS_CSTCOFINS,
                                                        MOVIMENTOSITENS_ALIQUOTACOFINS,
                                                        MOVIMENTOSITENS_BASECOFINS,
                                                        MOVIMENTOSITENS_VALORCOFINS,
                                                        MOVIMENTOSITENS_VALORCOFINSST,
                                                        MOVIMENTOSITENS_MARGEM
                                                  from MOVIMENTOSITENS
                                                  join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                                  join NCMS on NCMS_ID = PRODUTOS_ID_NCMS
                                                  where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimentos[itens]['MOVIMENTOS_ID']}                                                   
                                                  order by MOVIMENTOSITENS_ID
                                                into
                                                  id,
                                                  cfop,
                                                  pruduto,
                                                  descricao,
                                                  unidade,
                                                  sku,
                                                  ncm,
                                                  quantidade,
                                                  preco,
                                                  custo,
                                                  percentualDesconto,
                                                  valorDesconto,
                                                  total,
                                                  aliquotaIcms,
                                                  baseIcms,
                                                  valorIcms,
                                                  aliquotaIpi,
                                                  valorIpi,
                                                  baseSubstituicao,
                                                  icmsSubstituicao,
                                                  valorSubstituicao,
                                                  frete,
                                                  seguro,
                                                  despesas,
                                                  situacaoTributaria,
                                                  situacaoTributariaPis,
                                                  aliquotaPis,
                                                  basePis,
                                                  valorPis,
                                                  varloPisSusbstituicao,
                                                  cstCofins,
                                                  aliquotaCofins,
                                                  baseCofins,
                                                  valorCofins,
                                                  valorCofinsSubstituicao,
                                                  margem
                                                do suspend;
                                              end `;

                    const movimentositens  = keysToLowerCase(await samosFB.executeSQL(sqlMovimentosItens, params));

                    data.movimentos.push({'id': movimentos[itens]['MOVIMENTOS_ID'],
                                          'cnpj': movimentos[itens]['EMPRESAS_CPFCNPJ'],
                                          'fantasia': movimentos[itens]['EMPRESAS_FANTASIA'],
                                          'tipo': movimentos[itens]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-2)==='03'?'S':'E',
                                          'status': movimentos[itens]['MOVIMENTOS_STATUS'],
                                          'numero': movimentos[itens]['MOVIMENTOS_NUMERO'],
                                          'serie': movimentos[itens]['MOVIMENTOS_SERIE'],
                                          'emissao': movimentos[itens]['MOVIMENTOS_EMISSAO'],
                                          'totalProdutos': movimentos[itens]['MOVIMENTOS_PRODUTOS'],
                                          'percentualDescontos': movimentos[itens]['MOVIMENTOS_PERCENTUAL'],
                                          'valorDescontos': movimentos[itens]['MOVIMENTOS_DESCONTOS'],
                                          'margem': movimentos[itens]['MOVIMENTOS_MARGEM'],
                                          'totalNota': movimentos[itens]['MOVIMENTOS_TOTAL'],
                                          'baseIcms': movimentos[itens]['MOVIMENTOS_BASEICMS'],
                                          'valorIcms': movimentos[itens]['MOVIMENTOS_VALORICMS'],
                                          'baseSubstituicao': movimentos[itens]['MOVIMENTOS_BASEST'],
                                          'valorSubstituicao': movimentos[itens]['MOVIMENTOS_VALORST'],
                                          'valorIpi': movimentos[itens]['MOVIMENTOS_VALORIPI'],
                                          'valorFrete': movimentos[itens]['MOVIMENTOS_VALORFRETE'],
                                          'valorSeguro': movimentos[itens]['MOVIMENTOS_VALORSEGURO'],
                                          'valorDespesas': movimentos[itens]['MOVIMENTOS_VALORDESPESAS'],
                                          'chaveNfe': movimentos[itens]['MOVIMENTOS_NFE'],
                                          'protocolo': movimentos[itens]['MOVIMENTOS_PROTOCOLO'],
                                          'cfop': movimentos[itens]['MOVIMENTOS_ID_OPERACOES'].toString().slice(0, 4),
                                          'operacao': movimentos[itens]['OPERACOES_NOME'],
                                          'prazo': movimentos[itens]['PRAZOS_NOME'],
                                          'parcelas': movimentos[itens]['PRAZOS_PARCELAS'],
                                          'vendedor': movimentos[itens]['USUARIOS_NOME'],
                                          'cpfcnpj': movimentos[itens]['PESSOAS_CPFCNPJ'],
                                          'nome': movimentos[itens]['PESSOAS_NOME'],
                                          'cep': movimentos[itens]['PESSOAS_CEP'],
                                          'endereco': movimentos[itens]['PESSOAS_ENDERECO'],
                                          'numero': movimentos[itens]['PESSOAS_NUMERO'],
                                          'bairro': movimentos[itens]['PESSOAS_BAIRRO'],
                                          'cidade': movimentos[itens]['CIDADES_NOME'],
                                          'estado': movimentos[itens]['CIDADES_ESTADO'],
                                          'itens' : movimentositens
                                    });
                } 
              data.meta = {'page': page,
                           'limit': limit,
                           'total': total,
                           'totalPages': parseInt(total / limit),
                           'NextPage': parseInt(total / limit)>1?true:false
                           };
            }

            return {data }
            
        } catch(error) {
            const msg = 'Falha ao buscar MOVIMENTOS';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }

      function keysToLowerCase(obj) {
        if (Array.isArray(obj)) {
          return obj.map(item => keysToLowerCase(item));
        }
        if (obj !== null && typeof obj === 'object') {
          return Object.keys(obj).reduce((acc, key) => {
            acc[key.toLowerCase()] = keysToLowerCase(obj[key]);
            return acc;
          }, {});
        }
        return obj;
      }


    }


};
