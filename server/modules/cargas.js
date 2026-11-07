'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, conteudo, ordem, status, start, limit } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';
            let sqlEmpresa = empresa ? `and MANIFESTOS_ID_EMPRESAS = '${empresa}' ` : '';
            let sqlWhere = `where MANIFESTOS_ID > 0 ${sqlEmpresa} `;

            if(!ordem || ordem == 0){ sqlWhere += ` and MANIFESTOS_PLACAVEICULO = '${(conteudo || '').trim().toUpperCase()}' `; }
            if(ordem == 1){ sqlWhere += ` and MANIFESTOS_TRANSPNOME like '${conteudo}%' `; }
            
            if(ordem == 0) {
                sqlOrder = ` order by MANIFESTOS_PLACAVEICULO, MANIFESTOS_EMISSAO, MANIFESTOS_ID descending`;
            } else if (ordem == 1) {
                sqlOrder = ` order by MANIFESTOS_TRANSPNOME, MANIFESTOS_EMISSAO, MANIFESTOS_ID descending`;
            }
                    
            const sqlCount  = `select count(MANIFESTOS_ID) from MANIFESTOS ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    MANIFESTOS_ID as CARGAS_ID, 
                    MANIFESTOS_NUMERO as CARGAS_NUMERO, 
                    MANIFESTOS_SERIE as CARGAS_SERIE,
                    MANIFESTOS_EMISSAO as CARGAS_EMISSAO, 
                    MANIFESTOS_STATUS as CARGAS_STATUS, 
                    MANIFESTOS_ID_EMPRESAS as CARGAS_ID_EMPRESAS, 
                    MANIFESTOS_ID_TRANSPORTES, 
                    MANIFESTOS_TIPOFRETE as CARGAS_TIPOFRETE,
                    MANIFESTOS_TIPOVEICULO as CARGAS_TIPOVEICULO,
                    MANIFESTOS_TIPOCARROCERIA as CARGAS_TIPOCARROCERIA,
                    MANIFESTOS_TIPOCARGA as CARGAS_TIPOCARGA,
                    MANIFESTOS_TIPOEMITENTE as CARGAS_TIPOEMITENTE,
                    MANIFESTOS_RENAVAN as CARGAS_RENAVAN,
                    MANIFESTOS_RNTC as CARGAS_RNTC,
                    MANIFESTOS_CIOT as CARGAS_CIOT,
                    MANIFESTOS_PLACAVEICULO as CARGAS_PLACAVEICULO,
                    MANIFESTOS_PLACAUFVEICULO as CARGAS_PLACAUFVEICULO,
                    MANIFESTOS_TARAVEICULO as CARGAS_TARAVEICULO,
                    MANIFESTOS_CARGAVEICULO as CARGAS_CARGAVEICULO,
                    MANIFESTOS_TAMANHOVEICULO as CARGAS_TAMANHOVEICULO,
                    MANIFESTOS_PLACAREBOQUE as CARGAS_PLACAREBOQUE,
                    MANIFESTOS_PLACAREBOQUEUF as CARGAS_PLACAREBOQUEUF,
                    MANIFESTOS_TARAREBOQUE as CARGAS_TARAREBOQUE,
                    MANIFESTOS_CARGAREBOQUE as CARGAS_CARGAREBOQUE,
                    MANIFESTOS_TAMANHOREBOQUE as CARGAS_TAMANHOREBOQUE,
                    MANIFESTOS_PERCURSOINICIAL as CARGAS_PERCURSOINICIAL,
                    MANIFESTOS_PERCURSOFINAL as CARGAS_PERCURSOFINAL,
                    MANIFESTOS_ID_CARREGAMENTO as CARGAS_ID_CARREGAMENTO,
                    MANIFESTOS_SEGURADORA as CARGAS_SEGURADORA,
                    MANIFESTOS_CPFCNPJ as CARGAS_CPFCNPJ,
                    MANIFESTOS_APOLICE as CARGAS_APOLICE,
                    MANIFESTOS_AVERBACAO as CARGAS_AVERBACAO,
                    MANIFESTOS_CONTRATANTE as CARGAS_CONTRATANTE,
                    MANIFESTOS_EMAIL as CARGAS_EMAIL,
                    MANIFESTOS_PREDOMINANTE as CARGAS_PREDOMINANTE,
                    MANIFESTOS_NCM as CARGAS_NCM,
                    MANIFESTOS_CEPORIGEM as CARGAS_CEPORIGEM,
                    MANIFESTOS_CEPDESTINO as CARGAS_CEPDESTINO,
                    MANIFESTOS_TRANSPCPFCNPJ as CARGAS_TRANSPCPFCNPJ,
                    MANIFESTOS_TRANSPNOME as CARGAS_TRANSPNOME,
                    CIDADES_IBGE as CARGAS_CIDADESIBGE,
                    CIDADES_NOME as CARGAS_CIDADESNOME,
                    CIDADES_ESTADO as CARGAS_CIDADESESTADO
                from MANIFESTOS 
                join CIDADES on CIDADES_ID = MANIFESTOS_ID_CARREGAMENTO
                ${sqlWhere} ${sqlOrder}`; 

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