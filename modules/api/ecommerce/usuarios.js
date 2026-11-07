'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const fs      = require('fs');

module.exports = {
    read: async (params) => {
        let {id, celular, start,  limit } = params;

        let data = {};
        
        const limites = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
        
        let sqlWhere = ` where USUARIOS_STATUS = 'T' and USUARIOS_TIPO = '2' `;

        if (id !== '') {
          sqlWhere += ` and USUARIOS_ID = '${id}' `;            
        }
        if (celular !== '') {
          sqlWhere += ` and USUARIOS_CELULAR like '%${celular}%' `;            
        }     

        try {
                        const sqlUsuarios = `execute block returns(USUARIOS_ID      INTEGER,
                                                       USUARIOS_STATUS              CHAR(1),
                                                       USUARIOS_NOME                VARCHAR(50),
                                                       USUARIOS_CEP                 VARCHAR(8),
                                                       USUARIOS_ENDERECO            VARCHAR(50),
                                                       USUARIOS_NUMERO              VARCHAR(10),
                                                       USUARIOS_BAIRRO              VARCHAR(50),
                                                       USUARIOS_EMAIL               VARCHAR(50),
                                                       USUARIOS_TELEFONE            VARCHAR(15),
                                                       USUARIOS_CELULAR             VARCHAR(15),
                                                       USUARIOS_LOGIN               VARCHAR(50),
                                                       USUARIOS_ID_CIDADES          INTEGER,
                                                       CIDADES_NOME                 VARCHAR(50),
                                                       CIDADES_ESTADO               VARCHAR(2),
                                                       USUARIOS_FOTO                VARCHAR(256)                                                      
                                                     )
                                as
                                begin
                                for
                                select ${limites}
                                      USUARIOS_ID,
                                      USUARIOS_STATUS,
                                      USUARIOS_NOME,
                                      USUARIOS_CEP,
                                      USUARIOS_ENDERECO,
                                      USUARIOS_NUMERO,
                                      USUARIOS_BAIRRO,
                                      USUARIOS_EMAIL,
                                      USUARIOS_TELEFONE,
                                      USUARIOS_CELULAR,
                                      USUARIOS_LOGIN,
                                      USUARIOS_ID_CIDADES,
                                      CIDADES_NOME,
                                      CIDADES_ESTADO
                                from USUARIOS
                                join CIDADES on CIDADES_ID = USUARIOS_ID_CIDADES
                                ${sqlWhere} 
                                order by USUARIOS_LOGIN
                                into
                                    USUARIOS_ID,
                                    USUARIOS_STATUS,
                                    USUARIOS_NOME,
                                    USUARIOS_CEP,
                                    USUARIOS_ENDERECO,
                                    USUARIOS_NUMERO,
                                    USUARIOS_BAIRRO,
                                    USUARIOS_EMAIL,
                                    USUARIOS_TELEFONE,
                                    USUARIOS_CELULAR,
                                    USUARIOS_LOGIN,
                                    USUARIOS_ID_CIDADES,
                                    CIDADES_NOME,
                                    CIDADES_ESTADO
                                do
                                    begin
                                      suspend;
                                    end
                                end
                            `;
                
            const usuarios = await samosFB.executeSQL(sqlUsuarios, params);
            let total      = usuarios.length;

            data.usuarios = [];
            if(usuarios.length > 0) {
                for(let itens in usuarios) {
                    const ListImagens = [];
                    ListImagens.push({'url':`https://${params.client}.samosweb.com.br/public/uploads/${params.client}/usuarios/${usuarios[itens]['USUARIOS_ID']}.jpeg`,
                                        'alt': usuarios[itens]['USUARIOS_ID'],
                                        'cover':false});          

                    data.usuarios.push({'usuarios_id': usuarios[itens]['USUARIOS_ID'],
                                        'usuarios_status': usuarios[itens]['USUARIOS_STATUS']='T'?true:false,
                                        'usuarios_nome': usuarios[itens]['USUARIOS_NOME'],
                                        'usuarios_cep': usuarios[itens]['USUARIOS_CEP'],
                                        'usuarios_endereco': usuarios[itens]['USUARIOS_ENDERECO'],
                                        'usuarios_numero': usuarios[itens]['USUARIOS_NUMERO'],
                                        'usuarios_bairro': usuarios[itens]['USUARIOS_BAIRRO'],
                                        'usuarios_email': usuarios[itens]['USUARIOS_EMAIL'],
                                        'usuarios_telefone': usuarios[itens]['USUARIOS_TELEFONE'],
                                        'usuarios_celular': usuarios[itens]['USUARIOS_CELULAR'],
                                        'usuarios_login': usuarios[itens]['PESSOAS_ID_USUARIOS'],
                                        'usuarios_id_cidades': usuarios[itens]['USUARIOS_ID_CIDADES'],
                                        'cidades_nome': usuarios[itens]['CIDADES_NOME'],
                                        'cidades_estado': usuarios[itens]['CIDADES_ESTADO'],
                                        'usuarios_foto': ListImagens                                        
                                    });
 
                } 
              data.meta = {'pagina': start,
                           'limite': limit,
                           'totalUsuarios': total,
                           'totalPagina': parseInt(total / limit),
                           'ProximaPagina': parseInt(total / limit)>1?true:false
                           };
            }

            return {data}
            
        } catch(error) {
            const msg = 'Falha ao buscar USUARIOS';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};