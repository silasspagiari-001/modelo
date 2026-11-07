'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {

            const { empresa, conteudo, ordem, tipo, status} = params;
            const db = await samosFB.conectarBanco(params.client);            
            
            let sqlWhere = `where USUARIOS_ID > 0  `;
                sqlWhere += empresa ? `and USUARIOS_ID_EMPRESAS = ${empresa} ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and USUARIOS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {      
                if(tipo && tipo != 'z') {
                    sqlWhere += `and USUARIOS_TIPO = '${tipo}' `; 
                }

                if(status) {
                    if(status == 0) {//traz os Internos, Externos e Internos/Externos (todos os ativos)
                        sqlWhere += ` and (USUARIOS_STATUS = 'I' or USUARIOS_STATUS = 'E' or USUARIOS_STATUS = 'T') `
                    } else if (status == 1) {
                        sqlWhere += ` and USUARIOS_STATUS = 'I'`
                    } else if (status == 2) {
                        sqlWhere += ` and USUARIOS_STATUS = 'E'`
                    } else if (status == 3) {
                        sqlWhere += ` and USUARIOS_STATUS = 'T'`
                    } else if (status == 4) {
                        sqlWhere += ` and USUARIOS_STATUS = 'F'`
                    } else if (status == 5) {
                        sqlWhere += ` and USUARIOS_STATUS = 'P'`
                    }
                }

                if(ordem == 0) {
                    sqlWhere += `and USUARIOS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by USUARIOS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and USUARIOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by USUARIOS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += `and upper(USUARIOS_LOGIN) like '%${conteudo.toString().toUpperCase()}%' `;
                    sqlOrder = ' order by USUARIOS_LOGIN ';  
                } else if (ordem == 3) {
                    sqlWhere += `and USUARIOS_CPFCNPJ like '%${conteudo}%' `;
                    sqlOrder = ' order by USUARIOS_CPFCNPJ ';  
                } else if (ordem == 4) {
                    sqlWhere += conteudo > 0 ? `and USUARIOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by USUARIOS_ID ';  
                }
            }

            const sqlSearch = `execute block returns (USUARIOS_ID integer,
                                USUARIOS_STATUS char(1),
                                USUARIOS_NOME varchar(50),
                                USUARIOS_LOGIN varchar(50),
                                USUARIOS_CELULAR varchar(15),
                                EMPRESAS_FANTASIA varchar(50),
                                USUARIOS_FILIAL01 char(1),
                                USUARIOS_FILIAL02 char(1),
                                USUARIOS_FILIAL03 char(1),
                                USUARIOS_FILIAL04 char(1),
                                USUARIOS_FILIAL05 char(1),
                                USUARIOS_FILIAL06 char(1),
                                USUARIOS_FILIAL07 char(1),
                                USUARIOS_FILIAL08 char(1),
                                USUARIOS_FILIAL09 char(1),
                                USUARIOS_FILIAL99 char(1)) as
                                declare variable PERMISSOES_ID_EMPRESAS integer;
                                begin
                                for
                                select USUARIOS_ID,
                                        USUARIOS_STATUS,
                                        USUARIOS_NOME,
                                        USUARIOS_LOGIN,
                                        USUARIOS_CELULAR,
                                        EMPRESAS_FANTASIA
                                from USUARIOS
                                join EMPRESAS on EMPRESAS_ID = USUARIOS_ID_EMPRESAS
                                ${sqlWhere} 
                                ${sqlOrder}
                                into
                                    :USUARIOS_ID,
                                    :USUARIOS_STATUS,
                                    :USUARIOS_NOME,
                                    :USUARIOS_LOGIN,
                                    :USUARIOS_CELULAR,
                                    :EMPRESAS_FANTASIA
                                do
                                begin
                                USUARIOS_FILIAL01 = 'F';
                                USUARIOS_FILIAL02 = 'F';
                                USUARIOS_FILIAL03 = 'F';
                                USUARIOS_FILIAL04 = 'F';
                                USUARIOS_FILIAL05 = 'F';
                                USUARIOS_FILIAL06 = 'F';
                                USUARIOS_FILIAL07 = 'F';
                                USUARIOS_FILIAL08 = 'F';
                                USUARIOS_FILIAL09 = 'F';
                                USUARIOS_FILIAL99 = 'F';
                                for
                                select PERMISSOES_ID_EMPRESAS
                                from PERMISSOES
                                join EMPRESAS on EMPRESAS_ID = PERMISSOES_ID_EMPRESAS
                                where PERMISSOES_ID_USUARIOS = :USUARIOS_ID
                                into
                                    :PERMISSOES_ID_EMPRESAS
                                do
                                    begin
                                    if (PERMISSOES_ID_EMPRESAS = 1)  then  USUARIOS_FILIAL01 = 'T';
                                    if (PERMISSOES_ID_EMPRESAS = 2)  then  USUARIOS_FILIAL02 = 'T';
                                    if (PERMISSOES_ID_EMPRESAS = 3)  then  USUARIOS_FILIAL03 = 'T';
                                    if (PERMISSOES_ID_EMPRESAS = 4)  then  USUARIOS_FILIAL04 = 'T';
                                    if (PERMISSOES_ID_EMPRESAS = 5)  then  USUARIOS_FILIAL05 = 'T';
                                    if (PERMISSOES_ID_EMPRESAS = 6)  then  USUARIOS_FILIAL06 = 'T';
                                    if (PERMISSOES_ID_EMPRESAS = 7)  then  USUARIOS_FILIAL07 = 'T';
                                    if (PERMISSOES_ID_EMPRESAS = 8)  then  USUARIOS_FILIAL08 = 'T';
                                    if (PERMISSOES_ID_EMPRESAS = 9)  then  USUARIOS_FILIAL09 = 'T';
                                    if (PERMISSOES_ID_EMPRESAS = 99) then  USUARIOS_FILIAL99 = 'T';
                                    end
                                suspend;
                                end
                            end`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                }
            });
        });
    }
};
