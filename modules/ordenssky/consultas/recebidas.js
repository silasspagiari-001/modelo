'use strict';

const samosFB = require('../../../services/samosFirebird');
const utils   = require('../../../services/samosUtils');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { 
                empresa, 
                numero, 
                conteudo,
                inicio, 
                final, 
                ordem, 
                status, 
                start, 
                limit
            } = params;

            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';

            let sqlEmpresa = empresa ? `and ORDENS_ID_EMPRESAS = ${empresa} ` : '';
            let sqlWhere = `where ORDENS_ID > 0 ${sqlEmpresa} `;
                
            if(numero > 0) {
                sqlWhere += ` and ORDENS_NUMERO = ${numero}`;
                sqlOrder = ` order by ORDENS_NUMERO `;    
            } else {
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and ORDENS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }

                if(conteudo) {
                    const conteudoUpper = (conteudo || '').toUpperCase();
                    const conteudoLike  = (conteudoUpper || '').replace(/\s/ig, '%');

                    if(ordem == 1) {
                        sqlWhere += ` and ORDENS_IDENTIFICACAO = '${conteudoUpper}' `;
                    } else if(ordem == 2){
    
                        sqlWhere += ` and (
                            ORDENS_CEP         = '${conteudoUpper}' or 
                            ORDENS_ENDERECO    like '%${conteudoLike}%' or 
                            ORDENS_COMPLEMENTO like '%${conteudoLike}%' or 
                            ORDENS_BAIRRO      like '%${conteudoLike}%' or 
                            CIDADES_NOME       like '%${conteudoLike}%' or 
                            CIDADES_ESTADO     = '${conteudoUpper}'
                        )`;
                    }
                }

                if(ordem == 0 || ordem == 2) {
                    sqlOrder = ` order by ORDENS_NUMERO `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by ORDENS_IDENTIFICACAO, ORDENS_ID_PESSOAS, ORDENS_ID_EMPRESAS, ORDENS_ID`;
                } else if (ordem == 3) {
                    sqlOrder = ` order by ORDENS_EMISSAO, ORDENS_ID_EMPRESAS, ORDENS_ID `;
                }

                if(status == 'A') {
                    sqlWhere += ` and ORDENS_STATUS      = '2' 
                                  and ORDENS_AGENDAMENTO = 'F' 
                                  and ORDENS_ID_USUARIOS = '1' `; 
                } else if(status != 'T') {
                    sqlWhere += ` and ORDENS_STATUS = '${status}' `; 
                }
            }
                    
            const sqlCount  = `select count(ORDENS_ID) from ORDENS 
                left join CIDADES on CIDADES_ID = ORDENS_ID_CIDADES
                ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    ORDENS_ID,
                    ORDENS_NUMERO,
                    ORDENS_EMISSAO,
                    substring(ORDENS_HORAEMISSAO  from 1 for 5) as ORDENS_HORAEMISSAO,
                    ORDENS_TEMPO,
                    ORDENS_STATUS,
                    ORDENS_PERIODO,
                    ORDENS_IDENTIFICACAO,
                    ORDENS_NOME,
                    ORDENS_CEP,
                    ORDENS_ENDERECO,
                    ORDENS_NUMEROLC,
                    ORDENS_COMPLEMENTO,
                    ORDENS_BAIRRO,
                    ORDENS_ID_CIDADES,
                    CIDADES_NOME,
                    CIDADES_ESTADO,
                    ORDENS_TELEFONE,
                    ORDENS_CELULAR,
                    ORDENS_CONTATOS,
                    ORDENS_PLANO,
                    ORDENS_AGENDAMENTO
                from ORDENS 
                left join CIDADES on CIDADES_ID = ORDENS_ID_CIDADES
                ${sqlWhere} ${sqlOrder} `; 

            const total = await samosFB.count(db, sqlCount);

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({ db, results, total, resolve, reject });
                }
            });
        });
    }
};