'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const fs      = require('fs');

module.exports = {
    read: async (params) => {
        let {filial,emissaoinicial,emissaofinal} = params;

        let sqlWhere = ` where MOVIMENTOS_ID > 0 `;
            sqlWhere += ` and right(MOVIMENTOS_ID_DOCUMENTOS,3) = '003'`;
            sqlWhere += ` and MOVIMENTOS_STATUS <> 'C' `
        if (filial !== '') {
          sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = '${filial}' `;            
        }
        if (emissaoinicial !== '') {
          if (emissaofinal === '') {
            emissaofinal = emissaoinicial;
          }
          sqlWhere += ` and MOVIMENTOS_EMISSAO between '${emissaoinicial}' and '${emissaofinal}' `;     
        }

        try {
            const sqlMovimentos = `select MOVIMENTOS_ID,
                                          MOVIMENTOS_NUMERO,
                                          MOVIMENTOS_SERIE,
                                          MOVIMENTOS_ID_OPERACOES,
                                          MOVIMENTOS_EMISSAO,
                                          MOVIMENTOS_TOTAL,
                                          MOVIMENTOS_OBSERVACOES,
                                          MOVIMENTOS_ID_PESSOAS,
                                          PESSOAS_CPFCNPJ,
                                          PESSOAS_NOME,
                                          PESSOAS_CEP,
                                          PESSOAS_ENDERECO,
                                          PESSOAS_NUMERO,
                                          PESSOAS_BAIRRO,
                                          CIDADES_NOME,
                                          CIDADES_ESTADO
                                      from MOVIMENTOS
                                      join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                      join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                      join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                                      ${sqlWhere} 
                                      order by MOVIMENTOS_ID
                            `;
            
            const movimentos = await samosFB.executeSQL(sqlMovimentos, params);
            
            const notas_saida  = [];

            if(movimentos.length > 0) {
                for (let cabecalho = 0; cabecalho < movimentos.length; cabecalho++) {              
                    let itens = [];
                    const sqlMovimentosItens = `select MOVIMENTOSITENS_ID_PRODUTOS,
                                                       PRODUTOS_NOME,
                                                       PRODUTOS_UNIDADE,
                                                       NCMS_NCM,
                                                       MOVIMENTOSITENS_ID_OPERACOES,
                                                       MOVIMENTOSITENS_QUANTIDADE,
                                                       MOVIMENTOSITENS_PRECO,
                                                       MOVIMENTOSITENS_TOTAL
                                                from MOVIMENTOSITENS 
                                                join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS 
                                                join NCMS on NCMS_ID = PRODUTOS_ID_NCMS
                                                where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimentos[cabecalho]['MOVIMENTOS_ID']} order by MOVIMENTOSITENS_ID`
                    const movimentosItens = await samosFB.executeSQL(sqlMovimentosItens, params);
                    if(movimentosItens.length > 0) {
                      for (let elementos = 0; elementos < movimentosItens.length; elementos++) {  
                        itens.push({'codigo_produto': movimentosItens[elementos]['MOVIMENTOSITENS_ID_PRODUTOS'],
                                    'descricao_produto': movimentosItens[elementos]['PRODUTOS_NOME'],     
                                    'cfop': movimentosItens[elementos]['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4),
                                    'ncm': movimentosItens[elementos]['NCMS_NCM'],
                                    'unidade': movimentosItens[elementos]['PRODUTOS_UNIDADE'],
                                    'quantidade': movimentosItens[elementos]['MOVIMENTOSITENS_QUANTIDADE'],
                                    'valor_unitario': movimentosItens[elementos]['MOVIMENTOSITENS_PRECO'],
                                    'valor_total_item': movimentosItens[elementos]['MOVIMENTOSITENS_TOTAL']
                                  });
                      }  
                    }  
                      
                    const destinatario = {'codigo_cliente': movimentos[cabecalho]['MOVIMENTOS_ID_PESSOAS'],
                                          'nome_razao': movimentos[cabecalho]['PESSOAS_NOME'],
                                          'cnpj': movimentos[cabecalho]['PESSOAS_CPFCNPJ'],
                                          'cidade': movimentos[cabecalho]['CIDADES_NOME'],
                                          'uf': movimentos[cabecalho]['CIDADES_ESTADO']
                                         };                 
                    
                    notas_saida.push({'numero_nota': movimentos[cabecalho]['MOVIMENTOS_NUMERO'],
                                      'serie_nota': movimentos[cabecalho]['MOVIMENTOS_SERIE'],                      
                                      'natureza_operacao': movimentos[cabecalho]['MOVIMENTOS_ID_OPERACOES'].toString().slice(0, 4),
                                      'data_emissao': movimentos[cabecalho]['MOVIMENTOS_EMISSAO'],
                                      'valor_total_nota': movimentos[cabecalho]['MOVIMENTOS_TOTAL'],
                                      'dados_adicionais': movimentos[cabecalho]['MOVIMENTOS_OBSERVACOES'], 
                                      'destinaratio': destinatario,
                                      'itens':itens
                                    });
                } 
            }

            return {notas_saida}
            
        } catch(error) {
            const msg = 'Falha ao buscar MOVIMENTOS';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }

    }

};
