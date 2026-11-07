'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const fs      = require('fs');

module.exports = {
    read: async (params) => {
        let {grupo, produto, page,  limit } = params;

        let data = {};

        const limits = (page >= 0 && limit >= 0) ? `first ${limit} skip ${page} ` : '';
        let sqlWhere = ` where PRODUTOS_LISTAPRECO = 'T' and GRUPOS_STATUS = 'T' `;
        if (produto !== '') {
          sqlWhere += ` and PRODUTOS_ID = ${produto} `;            
        }
//        console.log(sqlWhere);
        try {
            const sqlProdutos = `
                                execute block returns(PRODUTOS_ID        integer,
                                                      PRODUTOS_STATUS    varchar(1),
                                                      PRODUTOS_BARRA     varchar(15),
                                                      PRODUTOS_NOME      varchar(50),
                                                      PRODUTOS_UNIDADE   varchar(3),
                                                      PRODUTOS_ID_GRUPOS integer,
                                                      GRUPOS_NOME        varchar(50),
                                                      SALDOS_PRECO       numeric(12,2))
                                as
                                begin
                                for
                                select ${limits}
                                    PRODUTOS_ID,
                                    PRODUTOS_STATUS,
                                    PRODUTOS_BARRA,
                                    PRODUTOS_NOME,
                                    PRODUTOS_UNIDADE,
                                    PRODUTOS_ID_GRUPOS,
                                    GRUPOS_NOME,
                                    SALDOS_PRECO
                                from PRODUTOS
                                join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                                join SALDOS on SALDOS_ID_EMPRESAS = 1 and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                                ${sqlWhere} and PRODUTOS_ID_GRUPOS = ${grupo} 
                                order by PRODUTOS_ID_GRUPOS,PRODUTOS_NOME
                                into
                                    PRODUTOS_ID,
                                    PRODUTOS_STATUS,
                                    PRODUTOS_BARRA,
                                    PRODUTOS_NOME,
                                    PRODUTOS_UNIDADE,
                                    PRODUTOS_ID_GRUPOS,
                                    GRUPOS_NOME,
                                    SALDOS_PRECO
                                do
                                    begin
                                      suspend;
                                    end
                                end

                            `;
            const sqlGrupos = `
                                    execute block returns(GRUPOS_ID  integer,
                                                          GRUPOS_NOME varchar(50))
                                    as
                                    begin
                                      for
                                         select PRODUTOS_ID_GRUPOS,
                                                GRUPOS_NOME
                                         from PRODUTOS
                                         join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                                         join SALDOS on SALDOS_ID_EMPRESAS = 1 and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                                         ${sqlWhere} 
                                         group by GRUPOS_NOME,PRODUTOS_ID_GRUPOS
                                         order by GRUPOS_NOME
                                     into
                                         GRUPOS_ID ,
                                         GRUPOS_NOME
                                     do suspend;
                                    end `;

            const produtos = await samosFB.executeSQL(sqlProdutos, params);
            const grupos  = await samosFB.executeSQL(sqlGrupos, params);
            let total     = produtos.length;
                        
            let selectedGroup = {};
            data.groups       = [];
            for(let itens in grupos) {
                if (grupos[itens]['GRUPOS_ID'] == grupo) {
                   data.selectedGroup = {'id': grupos[itens]['GRUPOS_ID'],
                                         'name': grupos[itens]['GRUPOS_NOME'],
                                         'slug': grupos[itens]['GRUPOS_NOME'],
                                         'position': grupos[itens]['GRUPOS_ID'],
                                         'children': []
                                        };
                }
              data.groups.push({'id': grupos[itens]['GRUPOS_ID'],
                                'name': grupos[itens]['GRUPOS_NOME'],
                                'slug': grupos[itens]['GRUPOS_NOME'],
                                'position': grupos[itens]['GRUPOS_ID'],
                                'children': []});
            }

            if(selectedGroup.length > 0) {
              data.push(selectedGroup);
            }
            if(produtos.length > 0) {
                data.products = [];
                for(let itens in produtos) {
                    const ListImagens = [];
                    const pathfotos   = process.platform === 'win32'?`c:\\samosadmin\\server\\public\\uploads\\${params.client}\\produtos` : `/home/samosadmin/server/public/uploads/${params.client}/produtos`
                  
                    if (fs.existsSync(pathfotos + (process.platform === 'win32'?'\\':'/') + produtos[itens]['PRODUTOS_ID'])) {                 
                   
                      const ArrayImagens = fs.readdirSync(pathfotos + (process.platform === 'win32'?'\\':'/') + produtos[itens]['PRODUTOS_ID'].toString());  
                      if(ArrayImagens.length > 0) {
                        for(let fotos in ArrayImagens) {
                          ListImagens.push({'url': process.platform === 'win32' ? `http://localhost:3000/public/uploads/${params.client}/produtos/`:`https://${params.client}.samosweb.com.br/public/uploads/${params.client}/produtos/${produtos[itens]['PRODUTOS_ID']}/${ArrayImagens[fotos]}`,
                                            'alt': produtos[itens]['PRODUTOS_ID'],
                                            'cover': ArrayImagens[fotos]==='1.png'?true:false});
                        }                  
                      } 
                    }                        

                    data.products.push({'id': produtos[itens]['PRODUTOS_ID'],
                                       'sku': produtos[itens]['PRODUTOS_BARRA'],
                                       'name': produtos[itens]['PRODUTOS_NOME'],
                                       'slug': produtos[itens]['PRODUTOS_FABRICA'],
                                       'shortDescription': produtos[itens]['PRODUTOS_NOME'],
                                       'group': produtos[itens]['PRODUTOS_ID_GRUPOS'],
                                       'images': ListImagens,
                                       'status': produtos[itens]['PRODUTOS_STATUS']='T'?'active':'inactive'
                                    });

                } 
              data.meta = {'page': page,
                           'limit': limit,
                           'totalProducts': total,
                           'totalPages': parseInt(total / limit),
                           'hasNextPage': parseInt(total / limit)>1?true:false
                           };
            }

            return {data }
            
        } catch(error) {
            const msg = 'Falha ao buscar PRODUTOS';
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