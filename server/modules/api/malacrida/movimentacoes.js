'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');

module.exports = {
    read: async (params) => {

      let {filial, produto, datainicial,datafinal, start, limit } = params;

        let data = {};

        const limites = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

        let sqlWhere = ` where MOVIMENTOSITENS_ID > 0 `;
        
        if (filial !== '') {
          sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = '${filial}' `;            
        }
        if (produto !== '') {
          sqlWhere += ` and MOVIMENTOSITENS_ID_PRODUTOS = '${produto}' `;            
        }
        if (datainicial !== '') {
          if (datafinal === '') {
            datafinal = datainicial;
          }
          sqlWhere += ` and MOVIMENTOS_EMISSAO between '${datainicial}' and '${datafinal}' `;     
        }

        try {
            const sqlMovimentacoes = `execute block returns (
                                                              MOVIMENTOSITENS_ID_MOVIMENTOS integer,
                                                              MOVIMENTOS_ID_EMPRESAS integer,
                                                              MOVIMENTOS_EMISSAO date,
                                                              MOVIMENTOS_ENTRADASAIDA date,
                                                              MOVIMENTOS_KARDEX date,
                                                              MOVIMENTOS_NUMERO integer,
                                                              MOVIMENTOS_SERIE varchar(3),
                                                              MOVIMENTOSITENS_ID_OPERACOES integer,
                                                              OPERACOES_NOME varchar(50),
                                                              OPERACOES_ESTOQUE char(1),
                                                              MOVIMENTOSITENS_QUANTIDADE numeric (12,3),
                                                              MOVIMENTOSITENS_PRECO numeric (12,2),
                                                              MOVIMENTOSITENS_TOTAL numeric (12, 2),
                                                              PESSOAS_NOME varchar(50),
                                                              PESSOAS_FANTASIA varchar(50),
                                                              MOVIMENTOSITENS_SALDO  numeric (12,3)
                                                          ) as
                                                              declare variable V_SALDO numeric (12,3);
                                                          
                                                              begin
                                                                V_SALDO = 0;
                                                                for
                                                                  select MOVIMENTOSITENS_ID_MOVIMENTOS,
                                                                        MOVIMENTOS_ID_EMPRESAS,
                                                                        MOVIMENTOS_EMISSAO,
                                                                        MOVIMENTOS_ENTRADASAIDA,
                                                                        iif(MOVIMENTOS_ENTRADASAIDA > MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_EMISSAO) as MOVIMENTOS_KARDEX,
                                                                        MOVIMENTOS_NUMERO,
                                                                        MOVIMENTOS_SERIE,
                                                                        MOVIMENTOSITENS_ID_OPERACOES,
                                                                        OPERACOES_NOME,
                                                                        OPERACOES_ESTOQUE,
                                                                        MOVIMENTOSITENS_QUANTIDADE,
                                                                        MOVIMENTOSITENS_PRECO,
                                                                        MOVIMENTOSITENS_TOTAL,
                                                                        PESSOAS_NOME,
                                                                        PESSOAS_FANTASIA
                                                                  from MOVIMENTOSITENS
                                                                  join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                                                                  join PESSOAS on PESSOAS_ID        = MOVIMENTOS_ID_PESSOAS
                                                                  join OPERACOES  on OPERACOES_ID   = MOVIMENTOSITENS_ID_OPERACOES
                                                                  ${sqlWhere} and
                                                                  OPERACOES_ESTOQUE in ('C','D') and
                                                                  MOVIMENTOS_STATUS not in ('C','R','D')
                                                                  order by MOVIMENTOS_KARDEX
                                                                  into  :MOVIMENTOSITENS_ID_MOVIMENTOS,
                                                                        :MOVIMENTOS_ID_EMPRESAS,
                                                                        :MOVIMENTOS_EMISSAO,
                                                                        :MOVIMENTOS_ENTRADASAIDA,
                                                                        :MOVIMENTOS_KARDEX,
                                                                        :MOVIMENTOS_NUMERO,
                                                                        :MOVIMENTOS_SERIE,
                                                                        :MOVIMENTOSITENS_ID_OPERACOES,
                                                                        :OPERACOES_NOME,
                                                                        :OPERACOES_ESTOQUE,
                                                                        :MOVIMENTOSITENS_QUANTIDADE,
                                                                        :MOVIMENTOSITENS_PRECO,
                                                                        :MOVIMENTOSITENS_TOTAL,
                                                                        :PESSOAS_NOME,
                                                                        :PESSOAS_FANTASIA
                                                                do
                                                                  begin
                                                                    if (OPERACOES_ESTOQUE = 'C') then
                                                                      begin
                                                                        if (MOVIMENTOS_ENTRADASAIDA is not null) then
                                                                          MOVIMENTOS_EMISSAO = MOVIMENTOS_ENTRADASAIDA;
                                                                        V_SALDO = V_SALDO + :MOVIMENTOSITENS_QUANTIDADE;
                                                                      end                    
                                                                    else
                                                                      if (OPERACOES_ESTOQUE = 'D') THEN
                                                                        V_SALDO = V_SALDO - :MOVIMENTOSITENS_QUANTIDADE;
                                                                      MOVIMENTOSITENS_SALDO = :V_SALDO;
                                                                    if ((MOVIMENTOS_KARDEX >= '${datainicial.replace (/\//ig,'.')}') and (MOVIMENTOS_KARDEX <= '${datafinal.replace (/\//ig,'.')}')) then
                                                                        suspend;
                                                                  end
                                                              end;`;
            
            const movimentacoes = await samosFB.executeSQL(sqlMovimentacoes, params);
            let total           = movimentacoes.length;

            data.movimentacoes = [];

            if(movimentacoes.length > 0) {
                for(let itens in movimentacoes) {
                  data.movimentacoes.push({
                                            'id': movimentacoes[itens]['MOVIMENTOSITENS_ID_MOVIMENTOS'],
                                            'filial': movimentacoes[itens]['MOVIMENTOS_ID_EMPRESAS'],
                                            'emissao': movimentacoes[itens]['MOVIMENTOS_EMISSAO'],
                                            'entradasaida': movimentacoes[itens]['MOVIMENTOS_ENTRADASAIDA'],
                                            'numero': movimentacoes[itens]['MOVIMENTOS_NUMERO'],
                                            'serie': movimentacoes[itens]['MOVIMENTOS_SERIE'],
                                            'cfop': movimentacoes[itens]['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4),
                                            'operacao': movimentacoes[itens]['OPERACOES_NOME'],
                                            'quantidade': movimentacoes[itens]['MOVIMENTOSITENS_QUANTIDADE'],
                                            'preco': movimentacoes[itens]['MOVIMENTOSITENS_PRECO'],
                                            'total': movimentacoes[itens]['MOVIMENTOSITENS_TOTAL'],
                                            'nome': movimentacoes[itens]['PESSOAS_NOME'],
                                            'fantasia': movimentacoes[itens]['PESSOAS_FANTASIA'],
                                            'saldo': movimentacoes[itens]['MOVIMENTOSITENS_SALDO']
                                    });
 
                } 
              data.meta = {'page': start,
                           'limit': limit,
                           'total': total,
                           'totalPage': parseInt(total / limit),
                           'nextPage': parseInt(total / limit)>1?true:false
                           };
            }

            return {data}
            
        } catch(error) {
            const msg = 'Falha ao buscar MOVIMENTACOES';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }

    }
};