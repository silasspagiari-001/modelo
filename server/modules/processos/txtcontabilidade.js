'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const moment    = require('moment-timezone');
const mkdirp    = require('mkdirp');
const utils     = require('../../services/samosUtils');
const cents     = utils.number.cents.bind(utils.number);
const grams     = utils.number.grams.bind(utils.number);
const strZero   = utils.number.strZero.bind(utils.number);

moment.locale('pt_BR');

const samosFB = require('../../services/samosFirebird');

module.exports = {
    read: async params => { 
        const db = await samosFB.conectarBanco(params.client); 
        const nomeArquivo = 'RACA_' + strZero(params.mes, 2) + params.ano.toString();
        let conteudo = '';
        let dadosNotas  = await obterDados(db, params); // Registros 0200 / K200 - Cadastro de produtos

        const dataSld = moment(`${params.ano}-${params.mes}-01`).add(1, 'month').subtract(1, 'day').format('DDMMYYYY');
        const dataIni = '01'+ strZero(params.mes, 2) + params.ano.toString();
        const dataFin = dataSld;

        for(let i in dadosNotas) { // Registro K200

            let NFSDEB = dadosNotas[i]['CUSTOS_MASCARA'].split('|')[0] ?? 0;
            let NFSCRE = dadosNotas[i]['CUSTOS_MASCARA'].split('|')[1] ?? 0;
            let NFSHCD = dadosNotas[i]['CUSTOS_NOME'].split('|')[1]    ?? 0;
                        
            conteudo += strZero(i,6) + ",";
            conteudo += moment(dadosNotas[i]['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY') + "," ;

            conteudo += strZero(NFSDEB,8) + "," ;  

            if ((strZero(NFSDEB,8) != '00000000') && (strZero(NFSCRE,8) == '00000000')) {
               conteudo += strZero(100005,8) + "," 
            } else {
               conteudo += strZero(NFSCRE,8) + ","   
            }
            
            let valor = dadosNotas[i]['MOVIMENTOS_TOTAL'];
            let parteInteira = Math.floor(valor).toString().padStart(10, '0');
            let parteDecimal = (valor % 1).toFixed(2).split('.')[1];
            let formatado = `${parteInteira}.${parteDecimal}`;
            let nome = dadosNotas[i]['PESSOAS_NOME'] ?? '';
            nome = nome.toString();
            conteudo += formatado + "," ;  
            conteudo += strZero(NFSHCD,8) + "," ;  
            conteudo += nome.padEnd(40,' ') + "," ;
            conteudo += 'DCTO' + dadosNotas[i]['MOVIMENTOS_NUMERO']  + ",," ;

           if (dadosNotas[i]['MOVIMENTOS_ID_DOCUMENTOS'] == 10005) {
             conteudo += dadosNotas[i]['PESSOAS_CPFCNPJ']  ;
           }

           conteudo += '\n';
//          console.log('nome:', nome, typeof nome);
        }
        
        const caminhoSped = 'public/sped/';
        const caminhoCompleto = `${appRoot}/public/sped/`;
        const now = new Date().getTime();

        if (!fs.existsSync(caminhoCompleto)){
            await mkdirp(caminhoCompleto)
        }

        fs.writeFileSync(`${caminhoSped}/${nomeArquivo}.${'txt'}`, conteudo);

        return `${caminhoSped}${nomeArquivo}.txt`
    }
};

const obterDados = async function(db, params) {
    return new Promise(async (resolve, reject) => {
        const {empresa, mes, ano} = params;

        const inicio = moment(`${ano}.${mes}.01`).format('YYYY-MM-DD');
        const final  = moment(inicio).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD');

    let sql = '';

      sql = ` select MOVIMENTOS_ENTRADASAIDA, CUSTOS_MASCARA, CUSTOS_NOME,PESSOAS_CPFCNPJ,MOVIMENTOS_ID_DOCUMENTOS,  
                    MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE,MOVIMENTOS_ID_PESSOAS,PESSOAS_NOME,MOVIMENTOS_TOTAL
                from MOVIMENTOS
                left outer join PESSOAS    on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                left outer join CUSTOS     on CUSTOS_ID  = MOVIMENTOS_ID_CUSTOS
                where  MOVIMENTOS_ID_EMPRESAS  = ${empresa} and 
                        ((MOVIMENTOS_STATUS <> 'C') and 
                        (MOVIMENTOS_STATUS <> 'D') and
                        (MOVIMENTOS_STATUS <> 'R')) and
                        MOVIMENTOS_ID_DOCUMENTOS IN (10005,10003) and
                        MOVIMENTOS_ENTRADASAIDA between '${inicio}' and '${final}'
                        order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_NUMERO`;

          db.query(sql, (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });      
   });
};
