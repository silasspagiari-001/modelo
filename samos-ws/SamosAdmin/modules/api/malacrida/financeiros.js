'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const fs      = require('fs');

module.exports = {
    read: async (params) => {
        let {filial,tipo,status,emissaoinicial,emissaofinal, page,  limit } = params;

        let data = {};

        const limits = (page >= 0 && limit >= 0) ? `first ${limit} skip ${page} ` : '';
        
        let sqlWhere = ` where FINANCEIROS_ID > 0 `;

        if (filial !== '') {
          sqlWhere += ` and FINANCEIROS_ID_EMPRESAS = '${filial}' `;            
        }
        if (tipo !== '') {
          sqlWhere += ` and FINANCEIROS_TIPO = '${tipo}' `;            
        }
        if (status !== '') {
          sqlWhere += ` and FINANCEIROS_STATUS = '${status}' `;     
        }
        if (emissaoinicial !== '') {
          if (emissaofinal === '') {
            emissaofinal = emissaoinicial;
          }
          sqlWhere += ` and FINANCEIROS_EMISSAO between '${emissaoinicial}' and '${emissaofinal}' `;     
        }

        try {
            const sqlFinanceiros = `
                                execute block returns(FINANCEIROS_ID          integer,
                                                      FINANCEIROS_ID_EMPRESAS integer,                  
                                                      FINANCEIROS_TIPO        varchar(1),
                                                      FINANCEIROS_STATUS      varchar(1),
                                                      FINANCEIROS_NUMERO      varchar(15),
                                                      FINANCEIROS_SERIE       varchar(50),
                                                      FINANCEIROS_EMISSAO     date,
                                                      FINANCEIROS_VENCIMENTO  date,
                                                      FINANCEIROS_PAGAMENTO   date,
                                                      FINANCEIROS_BAIXA       date,
                                                      FINANCEIROS_ORIGINAL    numeric(12,2),
                                                      FINANCEIROS_ABERTO      numeric(12,2),
                                                      FINANCEIROS_PAGO        numeric(12,2),
                                                      FINANCEIROS_JUROS       numeric(12,2),
                                                      FINANCEIROS_DESCONTOS   numeric(12,2),
                                                      FINANCEIROS_TOTAL       numeric(12,2),
                                                      PESSOAS_CPFCNPJ         varchar(15),
                                                      PESSOAS_NOME            varchar(50),
                                                      PESSOAS_CEP             varchar(8),
                                                      PESSOAS_ENDERECO        varchar(50),
                                                      PESSOAS_NUMERO          varchar(10),
                                                      PESSOAS_BAIRRO          varchar(50),
                                                      CIDADES_NOME            varchar(50),
                                                      CIDADES_ESTADO          varchar(2),
                                                      APLICACOES_MASCARA      varchar(13),
                                                      APLICACOES_NOME         varchar(50)  
                                                      )
                                as
                                begin
                                for
                                select ${limits}
                                    FINANCEIROS_ID,
                                    FINANCEIROS_ID_EMPRESAS,
                                    FINANCEIROS_TIPO,
                                    FINANCEIROS_STATUS,
                                    FINANCEIROS_NUMERO,
                                    FINANCEIROS_SERIE,
                                    FINANCEIROS_EMISSAO,
                                    FINANCEIROS_VENCIMENTO,
                                    FINANCEIROS_PAGAMENTO,
                                    FINANCEIROS_BAIXA,
                                    FINANCEIROS_ORIGINAL,
                                    FINANCEIROS_ABERTO,
                                    FINANCEIROS_PAGO,
                                    FINANCEIROS_JUROS,
                                    FINANCEIROS_DESCONTOS,
                                    FINANCEIROS_TOTAL,
                                    PESSOAS_CPFCNPJ,
                                    PESSOAS_NOME,
                                    PESSOAS_CEP,
                                    PESSOAS_ENDERECO,
                                    PESSOAS_NUMERO,
                                    PESSOAS_BAIRRO,
                                    CIDADES_NOME,
                                    CIDADES_ESTADO,
                                    APLICACOES_MASCARA,
                                    APLICACOES_NOME
                                from FINANCEIROS
                                join APLICACOES on APLICACOES_ID = FINANCEIROS_ID_APLICACOES
                                join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                                join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                ${sqlWhere} 
                                order by FINANCEIROS_ID
                                into
                                    FINANCEIROS_ID,
                                    FINANCEIROS_ID_EMPRESAS,
                                    FINANCEIROS_TIPO,
                                    FINANCEIROS_STATUS,
                                    FINANCEIROS_NUMERO,
                                    FINANCEIROS_SERIE,
                                    FINANCEIROS_EMISSAO,
                                    FINANCEIROS_VENCIMENTO,
                                    FINANCEIROS_PAGAMENTO,
                                    FINANCEIROS_BAIXA,
                                    FINANCEIROS_ORIGINAL,
                                    FINANCEIROS_ABERTO,
                                    FINANCEIROS_PAGO,
                                    FINANCEIROS_JUROS,
                                    FINANCEIROS_DESCONTOS,
                                    FINANCEIROS_TOTAL,
                                    PESSOAS_CPFCNPJ,
                                    PESSOAS_NOME,
                                    PESSOAS_CEP,
                                    PESSOAS_ENDERECO,
                                    PESSOAS_NUMERO,
                                    PESSOAS_BAIRRO,
                                    CIDADES_NOME,
                                    CIDADES_ESTADO,
                                    APLICACOES_MASCARA,
                                    APLICACOES_NOME
                                do
                                    begin
                                      suspend;
                                    end
                                end

                            `;
            
            const financeiros = await samosFB.executeSQL(sqlFinanceiros, params);
            
            let total     = financeiros.length;

            if(financeiros.length > 0) {
                data.financeiros = [];
                for(let itens in financeiros) {
                    data.financeiros.push({'id': financeiros[itens]['FINANCEIROS_ID'],
                                           'filial': financeiros[itens]['FINANCEIROS_ID_EMPRESAS'],
                                           'tipo': financeiros[itens]['FINANCEIROS_TIPO'],
                                           'status': financeiros[itens]['FINANCEIROS_STATUS'],
                                           'numero': financeiros[itens]['FINANCEIROS_NUMERO'],
                                           'serie': financeiros[itens]['FINANCEIROS_SERIE'],
                                           'emissao': financeiros[itens]['FINANCEIROS_EMISSAO'],
                                           'vencimento': financeiros[itens]['FINANCEIROS_VENCIMENTO'],
                                           'pagamento': financeiros[itens]['FINANCEIROS_PAGAMENTO'],
                                           'baixa': financeiros[itens]['FINANCEIROS_BAIXA'],
                                           'original': financeiros[itens]['FINANCEIROS_ORIGINAL'],
                                           'aberto': financeiros[itens]['FINANCEIROS_ABERTO'],
                                           'pago': financeiros[itens]['FINANCEIROS_PAGO'],
                                           'juros': financeiros[itens]['FINANCEIROS_JUROS'],
                                           'descontos': financeiros[itens]['FINANCEIROS_DESCONTOS'],
                                           'total': financeiros[itens]['FINANCEIROS_TOTAL'],
                                           'cpfcnpj': financeiros[itens]['PESSOAS_CPFCNPJ'],
                                           'nome': financeiros[itens]['PESSOAS_NOME'],
                                           'cep': financeiros[itens]['PESSOAS_CEP'],
                                           'endereco': financeiros[itens]['PESSOAS_ENDERECO'],
                                           'numero': financeiros[itens]['PESSOAS_NUMERO'],
                                           'bairro': financeiros[itens]['PESSOAS_BAIRRO'],
                                           'cidade': financeiros[itens]['CIDADES_NOME'],
                                           'estado': financeiros[itens]['CIDADES_ESTADO'],
                                           'categoria': financeiros[itens]['APLICACOES_MASCARA'],    
                                           'aplicacao': financeiros[itens]['APLICACOES_NOME']  
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
            const msg = 'Falha ao buscar FINANCEIROS';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
