'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const moment    = require('moment-timezone');
const mkdirp    = require('mkdirp');

const objectsToCsv = require('objects-to-csv-delimited');

moment.locale('pt_BR');

const samosFB = require('../../services/samosFirebird'); 

module.exports = {
    read: async params => { 
        const db = await samosFB.conectarBanco(params.client); 
        const dados = await obterDados(db, params);

        const semCodigo = dados.filter(dado => (dado['CONTADEB'] == '' || dado['CONTACRE'] == ''));

        if(semCodigo && semCodigo.length > 0){                         
            return semCodigo;
        }    

        const dadosCsv = new objectsToCsv(dados, {delimiter: ';'});
        const caminhoCsv = 'public/csv/';
        const caminhoCompleto = `${appRoot}/public/csv/`;
        const now = new Date().getTime();

        if (!fs.existsSync(caminhoCompleto)){
            await mkdirp(caminhoCompleto)
        }

        await dadosCsv.toDisk(`${caminhoCsv}${now}.csv`, {header: false});

        return `${caminhoCsv}${now}.csv`
    }
};

const obterDados = function(db, params) {
    return new Promise(async (resolve, reject) => {

        const {empresa, mes, ano} = params;

        const inicio = moment(`01/${mes}/${ano}`, 'DD/MM/YYYY');
        const final  = moment(inicio).add(1, 'month').subtract(1, 'day');

		let sql = `select '' as BRANCO01,
                          iif(FINANCEIROS_TIPO = 'R', '55', PESSOAS_PAGINA) as CONTADEB,
                          iif(FINANCEIROS_TIPO = 'P', '55', PESSOAS_PAGINA) as CONTACRE,
                          cast(FINANCEIROS_PAGAMENTO as varchar(10)) as DATAPAGTO,
                          replace(cast(FINANCEIROS_PAGO as varchar(14)), '.', ',')      as VALORPAGO,
                          '' as BRANCO02,
                          iif(FINANCEIROS_TIPO = 'R', 'REC ', 'PAG ') || FINANCEIROS_NUMERO || '/' || FINANCEIROS_PARCELA || ' ' || PESSOAS_NOME as HISTORICO
                   from FINANCEIROS
                   join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                    where FINANCEIROS_ID_EMPRESAS = ${empresa}
                      and FINANCEIROS_PAGAMENTO between '${inicio.format('YYYY-MM-DD')}' and '${final.format('YYYY-MM-DD')}'
                      and FINANCEIROS_ID_CUSTOS <> 10
                      and FINANCEIROS_ID_CUSTOS <> 11
                      and FINANCEIROS_ID_CUSTOS <> 18
                      and FINANCEIROS_ID_CUSTOS <> 19
                    order by FINANCEIROS_PAGAMENTO, FINANCEIROS_ID`;

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