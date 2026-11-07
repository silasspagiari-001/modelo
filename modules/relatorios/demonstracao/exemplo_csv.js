'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const moment    = require('moment-timezone');
const mkdirp    = require('mkdirp');

const objectsToCsv = require('objects-to-csv');

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFirebird'); 

module.exports = {
    read: async params => { 
        const db = await samosFB.conectarBanco(params.client); 
        const dados = await obterDados(db, params);
        const dadosCsv = new objectsToCsv(dados);
        const caminhoCsv = 'public/csv/';
        const caminhoCompleto = `${appRoot}/public/csv/`;
        const now = new Date().getTime();

        if (!fs.existsSync(caminhoCompleto)){
            await mkdirp(caminhoCompleto)
        }

        await dadosCsv.toDisk(`${caminhoCsv}${now}.csv`);

        return `${caminhoCsv}${now}.csv`
    }
};

const obterDados = function(db, params) {
    return new Promise(async (resolve, reject) => {
		let sql = `
                select first 10 skip 0 
                       FINANCEIROS_ID,
                       FINANCEIROS_NUMERO,
                       FINANCEIROS_SERIE,
                       FINANCEIROS_PARCELA,
                       FINANCEIROS_PAGO,                       
                       FINANCEIROS_VENCIMENTO,
                       FINANCEIROS_PAGAMENTO,
                       FINANCEIROS_DESCONTOS,
                       FINANCEIROS_JUROS,
                       FINANCEIROS_TAXAS,
                       FINANCEIROS_PAGO,
                       FINANCEIROS_ID_PESSOAS,
                       PESSOAS_NOME,
                       FINANCEIROS_ID_USUARIOS,
                       USUARIOS_NOME,
                       FINANCEIROS_ID_APLICACOES,
                       APLICACOES_NOME
                from FINANCEIROS
                join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                join USUARIOS on USUARIOS_ID = FINANCEIROS_ID_USUARIOS
                join APLICACOES on APLICACOES_ID = FINANCEIROS_ID_APLICACOES
                where FINANCEIROS_ID_EMPRESAS = 1
                order by FINANCEIROS_ID_EMPRESAS`

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};