'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { conteudo, empresa, ordem, status, start, limit } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where DOCUMENTOS_ID > 0  `;
                sqlWhere += status == 0 ? ` and DOCUMENTOS_STATUS = 'T' ` : status == 1 ? `and DOCUMENTOS_STATUS = 'F' ` : '';
                sqlWhere += empresa     ? ` and DOCUMENTOS_ID_EMPRESAS = '${empresa}' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and DOCUMENTOS_ID = ${conteudo.replace(/\./ig,'')} `;
            } else  {    
                if(ordem == 0) {
                    sqlWhere += `and DOCUMENTOS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by DOCUMENTOS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and DOCUMENTOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by DOCUMENTOS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and DOCUMENTOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by DOCUMENTOS_ID ';  
                } else if(ordem == 3){
                    try {
                        const id = await samosFB.buscaMultipla({
                            db, conteudo,
                            tabela: 'DOCUMENTOS',
                            chave: 'DOCUMENTOS_ID',
                            campos: [
                                'DOCUMENTOS_ID', 
                                'DOCUMENTOS_NOME',
                                'DOCUMENTOS_SERIE'
                            ]
                        });
    
                        sqlWhere += `and DOCUMENTOS_ID = '${id}' `;
                        sqlOrder = ' order by DOCUMENTOS_ID '; 
                    } catch (e) {
                        reject(e);
                    }
                }
            }    

            const sqlCount  = `select count(*) from DOCUMENTOS  ${sqlWhere}`
            const sqlSearch = `select ${limits} DOCUMENTOS.*, 
                    PESSOAS_NOME, 
                    PESSOAS_FANTASIA, 
                    PESSOAS_CEP, 
                    PESSOAS_ENDERECO, 
                    PESSOAS_BAIRRO, 
                    PESSOAS_NUMERO,
                    PESSOAS_CPFCNPJ,
                    PESSOAS_EMAIL,
                    PESSOAS_TELEFONE,
                    PESSOAS_CELULAR,
                    PESSOAS_FORMULA,
                    PESSOAS_TIPO,
                    PESSOAS_ID_CIDADES,
                    CIDADES.CIDADES_NOME, 
                    CIDADES.CIDADES_ESTADO, 
                    CIDADES.CIDADES_IBGE,
                    OPERACOES_NOME,
                    OPERACOES_BAIXAVISTA, 
                    OPERACOES_ESTOQUE,
                    OPERACOES_FINANCEIRO, 
                    OPERACOES_UNICA, 
                    OPERACOES_FINALIDADE,
                    OPERACOES_TIPO, 
                    OPERACOES_ACAO, 
                    OPERACOES_ST,
                    OPERACOES_PISCOFINS,
                    OPERACOES_COMPLEMENTAR,
                    OPERACOES_ID_PRAZOS,
                    PRAZOS_NOME, 
                    PRAZOS_PARCELAS, 
                    PRAZOS_PARCELAMENTO,
                    OPERACOES_ID_APLICACOES, 
                    APLICACOES_NOME,
                    OPERACOES_ID_CUSTOS,
                    CUSTOS_NOME,
                    EMPRESAS_CPFCNPJ,
                    EMPRESAS_CNAE,
                    EMPRESAS_SIMPLES,
                    EMPRESAS_ID_CIDADES,
                    EMPRESAS_REGIAO12,
                    EMPRESAS_CEP,
                    CIDADESEMPRESA.CIDADES_NOME   as CIDADES_NOMEEMPRESA,
                    CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
                    CIDADESEMPRESA.CIDADES_IBGE   as CIDADES_IBGEEMPRESA
                from DOCUMENTOS
                left outer join PESSOAS    on PESSOAS_ID    = DOCUMENTOS_ID_PESSOAS
                left outer join CIDADES    on CIDADES_ID    = PESSOAS_ID_CIDADES
                left outer join OPERACOES  on OPERACOES_ID  = DOCUMENTOS_ID_OPERACOES
                left outer join PRAZOS     on PRAZOS_ID     = OPERACOES_ID_PRAZOS
                left outer join APLICACOES on APLICACOES_ID = DOCUMENTOS_ID_APLICACOES
                left outer join CUSTOS     on CUSTOS_ID     = OPERACOES_ID_CUSTOS
                left outer join EMPRESAS   on EMPRESAS_ID   = DOCUMENTOS_ID_EMPRESAS
                left outer join CIDADES as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS_ID_CIDADES                
                ${sqlWhere} ${sqlOrder}`;

            const total = await samosFB.count(db, sqlCount);

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total, resolve, reject});
                }
            })
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const empresa = data['DOCUMENTOS_ID_EMPRESAS'];
            const range = 10 ** (3 - empresa.toString().length) * empresa;
            const queryMaxId = await samosFB.query(db, `select max(DOCUMENTOS_ID) from DOCUMENTOS where DOCUMENTOS_ID between ${range}00 and ${range}99`);
            const lastId = queryMaxId && queryMaxId[0] ? queryMaxId[0]['MAX'] + 1 : await samosFB.lastId(db, 'DOCUMENTOS', 'GEN_DOCUMENTOS_ID', 'DOCUMENTOS_ID');
            data['DOCUMENTOS_ID'] = lastId;
            samosFB.removeForeignFields(data, 'DOCUMENTOS');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into DOCUMENTOS (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: data, resolve, reject});
                }
            });
        })
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            samosFB.removeForeignFields(data, 'DOCUMENTOS');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace(/{"/ig, '').replace(/":/ig, '=').replace(/,"/ig, ',').replace(/}/ig, '').replace(/"/ig, '\'');
            const sqlSearch = `update DOCUMENTOS set ${values} where DOCUMENTOS_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: data, resolve, reject}, function() {
                        api['processos/gerarlog']().create(params);
                    });
                }
            });
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const sqlSearch = `delete from DOCUMENTOS where DOCUMENTOS_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao excluir`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarExclusao({db, resolve, reject}, function() {
                        api['processos/gerarlog']().create(params);
                    });
                }
            });
        });
    }
};
