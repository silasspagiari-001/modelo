'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const fs      = require('fs');

module.exports = {
    read: async (params) => {
        let {cpfcnpj, celular, start,  limit } = params;

        let data = {};

        const limites = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
        
        let sqlWhere = ` where PESSOAS_STATUS = 'T' `;

        if (cpfcnpj !== '') {
          sqlWhere += ` and PESSOAS_CPFCNPJ = '${cpfcnpj}' `;            
        }
        if (celular !== '') {
          sqlWhere += ` and PESSOAS_CELULAR like '%${celular}%' `;            
        }     

        try {
            const sqlPessoas = `execute block returns(PESSOAS_ID                  INTEGER,
                                                      PESSOAS_STATUS              CHAR(1),
                                                      PESSOAS_CPFCNPJ             VARCHAR(15),
                                                      PESSOAS_INSCRICAO           VARCHAR(15),
                                                      PESSOAS_NOME                VARCHAR(50),
                                                      PESSOAS_CEP                 VARCHAR(8),
                                                      PESSOAS_ENDERECO            VARCHAR(50),
                                                      PESSOAS_NUMERO              VARCHAR(10),
                                                      PESSOAS_BAIRRO              VARCHAR(50),
                                                      PESSOAS_EMAIL               VARCHAR(50),
                                                      PESSOAS_ID_CIDADES          INTEGER,
                                                      PESSOAS_TELEFONE            VARCHAR(15),
                                                      PESSOAS_CELULAR             VARCHAR(15),
                                                      PESSOAS_ID_USUARIOS         INTEGER
                                                     )
                                as
                                begin
                                for
                                select ${limites}
                                      PESSOAS_ID,
                                      PESSOAS_STATUS,
                                      PESSOAS_CPFCNPJ,
                                      PESSOAS_INSCRICAO,
                                      PESSOAS_NOME,
                                      PESSOAS_CEP,
                                      PESSOAS_ENDERECO,
                                      PESSOAS_NUMERO,
                                      PESSOAS_BAIRRO,
                                      PESSOAS_EMAIL,
                                      PESSOAS_ID_CIDADES,
                                      PESSOAS_TELEFONE,
                                      PESSOAS_CELULAR,
                                      PESSOAS_ID_USUARIOS
                                from PESSOAS
                                join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                ${sqlWhere} 
                                order by PESSOAS_NOME
                                into
                                    PESSOAS_ID,
                                    PESSOAS_STATUS,
                                    PESSOAS_CPFCNPJ,
                                    PESSOAS_INSCRICAO,
                                    PESSOAS_NOME,
                                    PESSOAS_CEP,
                                    PESSOAS_ENDERECO,
                                    PESSOAS_NUMERO,
                                    PESSOAS_BAIRRO,
                                    PESSOAS_EMAIL,
                                    PESSOAS_ID_CIDADES,
                                    PESSOAS_TELEFONE,
                                    PESSOAS_CELULAR,
                                    PESSOAS_ID_USUARIOS
                                do
                                    begin
                                      suspend;
                                    end
                                end
                            `;
                            
            const pessoas = await samosFB.executeSQL(sqlPessoas, params);
            let total     = pessoas.length;
            data.pessoas  = [];
            if(pessoas.length > 0) {
                for(let itens in pessoas) {
                    const sqlPropriedades = `execute block returns(PROPRIEDADES_ID           INTEGER,
                                                                   PROPRIEDADES_STATUS       CHAR(1),
                                                                   PROPRIEDADES_ID_PESSOAS   INTEGER,
                                                                   PROPRIEDADES_CPFCNPJ      VARCHAR(15),
                                                                   PROPRIEDADES_INSCRICAO    VARCHAR(15),
                                                                   PROPRIEDADES_NOME         VARCHAR(50),
                                                                   PROPRIEDADES_ID_CIDADES   INTEGER,
                                                                   PROPRIEDADES_CEP          VARCHAR(8),
                                                                   PROPRIEDADES_ENDERECO     VARCHAR(50),
                                                                   PROPRIEDADES_NUMERO       VARCHAR(20),
                                                                   PROPRIEDADES_BAIRRO       VARCHAR(50),
                                                                   PROPRIEDADES_TELEFONE     VARCHAR(15),
                                                                   PROPRIEDADES_CELULAR      VARCHAR(15)
                                                                  )
                                            as
                                              begin
                                                for
                                                  select                                                       
                                                      PROPRIEDADES_ID,
                                                      PROPRIEDADES_STATUS,
                                                      PROPRIEDADES_ID_PESSOAS,
                                                      PROPRIEDADES_CPFCNPJ,
                                                      PROPRIEDADES_INSCRICAO,
                                                      PROPRIEDADES_NOME,
                                                      PROPRIEDADES_ID_CIDADES,
                                                      PROPRIEDADES_CEP,
                                                      PROPRIEDADES_ENDERECO,
                                                      PROPRIEDADES_NUMERO,
                                                      PROPRIEDADES_BAIRRO,
                                                      PROPRIEDADES_TELEFONE,
                                                      PROPRIEDADES_CELULAR
                                                  from PROPRIEDADES
                                                  join CIDADES on CIDADES_ID = PROPRIEDADES_ID_CIDADES
                                                  where PROPRIEDADES_ID_PESSOAS = ${pessoas[itens]['PESSOAS_ID']} 
                                                  order by PROPRIEDADES_ID
                                                into
                                                      PROPRIEDADES_ID,
                                                      PROPRIEDADES_STATUS,
                                                      PROPRIEDADES_ID_PESSOAS,
                                                      PROPRIEDADES_CPFCNPJ,
                                                      PROPRIEDADES_INSCRICAO ,
                                                      PROPRIEDADES_NOME,
                                                      PROPRIEDADES_ID_CIDADES,
                                                      PROPRIEDADES_CEP,
                                                      PROPRIEDADES_ENDERECO,
                                                      PROPRIEDADES_NUMERO,
                                                      PROPRIEDADES_BAIRRO,
                                                      PROPRIEDADES_TELEFONE,
                                                      PROPRIEDADES_CELULAR                                             
                                                do suspend;
                                              end `;
                    const propriedades  = await samosFB.executeSQL(sqlPropriedades, params);
                    data.pessoas.push({'pessoas_id': pessoas[itens]['PESSOAS_ID'],
                                       'pessoas_status': pessoas[itens]['PESSOAS_STATUS']='T'?true:false,
                                       'pessoas_cpfcnpj': pessoas[itens]['PESSOAS_CPFCNPJ'],
                                       'pessoas_inscricao': pessoas[itens]['PESSOAS_INSCRICAO'],
                                       'pessoas_nome': pessoas[itens]['PESSOAS_NOME'],
                                       'pessoas_cep': pessoas[itens]['PESSOAS_CEP'],
                                       'pessoas_endereco': pessoas[itens]['PESSOAS_ENDERECO'],
                                       'pessoas_numero': pessoas[itens]['PESSOAS_NUMERO'],
                                       'pessoas_bairro': pessoas[itens]['PESSOAS_BAIRRO'],
                                       'pessoas_email': pessoas[itens]['PESSOAS_EMAIL'],
                                       'pessoas_id_cidades': pessoas[itens]['PESSOAS_ID_CIDADES'],
                                       'pessoas_telefone': pessoas[itens]['PESSOAS_TELEFONE'],
                                       'pessoas_celular': pessoas[itens]['PESSOAS_CELULAR'],
                                       'pessoas_id_usuarios': pessoas[itens]['PESSOAS_ID_USUARIOS'],
                                       'pessoas_propriedades': propriedades,
                                    });
                } 
              data.meta = {'pagina': start,
                           'limite': limit,
                           'totalPessoas': total,
                           'totalPagina': parseInt(total / limit),
                           'ProximaPagina': parseInt(total / limit)>1?true:false
                           };
            }

            return {data}
            
        } catch(error) {
            const msg = 'Falha ao buscar PESSOAS';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
