'use strict';

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    readById: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            try {
                const sql = `select
                    ORDENSAVARIADOS_ID,
                    ORDENSAVARIADOS_MODELO,
                    ORDENSAVARIADOS_DESCRICAO,
                    ORDENSAVARIADOS_SERIAL,
                    ORDENSAVARIADOS_CARTAO,
                    ORDENSAVARIADOS_AGENDADA,
                    ORDENSAVARIADOS_HORAAGENDADA,
                    ORDENSAVARIADOS_LIMITE,
                    ORDENSAVARIADOS_HORALIMITE,
                    ORDENSAVARIADOS_SITUACAO
                from ORDENSAVARIADOS 
                where ORDENSAVARIADOS_ID_ORDENS = '${id}'
                order by ORDENSAVARIADOS_ID `;
                
                const results = await db.query(sql);
                const queryObservacoes = await db.query(`select ORDENS_OBSERVACOES from ORDENS where ORDENS_ID = ${id}`);
                
                let observacoes = queryObservacoes[0]['ORDENS_OBSERVACOES'] || '';

                if(observacoes) {                    
                    observacoes = observacoes.split('|')
                        .filter(linha => !!linha)
                        .filter(linha => !linha.match(/Agendador:/))
                        .reduce((obj, linha) => {
                            obj['OBSERVACOES'] = obj['OBSERVACOES'] || '';

                            if(!!linha.match(/Contato:/)){
                                obj['CONTATO'] = linha.replace(/Contato:/, '').trim()
                            } else if(!!linha.match(/Celular:/)){
                                obj['CELULAR'] = linha.replace(/Celular:/, '').trim()
                            } else if(!!linha.match(/Referência:/)){
                                obj['REFERENCIA'] = linha.replace(/Referência:/, '').trim()
                            } else if(!!linha.match(/Obs:/)){
                                obj['OBSERVACOES'] = linha.replace(/Obs:/, '').trim()
                            }

                            return obj;
                        }, {});
                }

                for(let i in results) {
                    results[i]['ORDENSAVARIADOS_AGENDADA'] = (results[i]['ORDENSAVARIADOS_AGENDADA'] || '').split('-').reverse().join('/');
                    results[i]['ORDENSAVARIADOS_LIMITE']   = (results[i]['ORDENSAVARIADOS_LIMITE']   || '').split('-').reverse().join('/');
                    Object.assign(results[i], observacoes);
                }

                samosFB.processarLeitura({ db, results, total: 1, resolve, reject });
            } catch(error) {
                samosFB.enviarRespostaErro(`Erro /ordenssky/consultas/agendamento`, db, error, reject);
            }
        });
    }
};