'use strict';

const samosFB = require('../../../services/samosFirebird');
const moment  = require('moment-timezone');
const api     = require('../..');

module.exports = {
    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sql = '';
            
            try {
                const log = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;
                const ordemAnterior = await db.query(`select 
                    ORDENS_OBSERVACOES, ORDENS_AGENDAMENTO, ORDENS_ID_USUARIOS
                    from ORDENS where ORDENS_ID = ${id}
                `);
                const estavaAgendada = ordemAnterior[0]['ORDENS_AGENDAMENTO'] == 'T';
                const agendar = data['ORDENSAVARIADOS_AGENDADA'] && !(data['ORDENSAVARIADOS_AGENDADA'] || '').match(/1899/);
                const alocar  = data['ORDENS_ID_USUARIOS'] != '1' && ordemAnterior[0]['ORDENS_ID_USUARIOS'] != data['ORDENS_ID_USUARIOS'];

                let observacoesExistente = ordemAnterior[0]['ORDENS_OBSERVACOES'] || '';
                let observacoesAtualizada = '';

                if(observacoesExistente) {                    
                    observacoesExistente = observacoesExistente.split('|').filter(linha => !!linha);//traz apenas linhas prenchidas
                    observacoesExistente = observacoesExistente.filter(linha => {//deixa apenas observações que não são do agendamento
                        return (
                            !linha.match(/Agendador:/) &&
                            !linha.match(/Contato:/) &&
                            !linha.match(/Celular:/) &&
                            !linha.match(/Referência:/) &&
                            !linha.match(/Obs:/) &&
                            !linha.match(/Agendamento Cancelado:/)
                        )
                    }).join('|');
                }

                if(agendar) {
                    observacoesAtualizada += `Agendador: ${log}|`;

                    if(data['contato']) {
                        observacoesAtualizada += `Contato: ${data['contato']}|`;
                    }
                    if(data['celular']) {
                        observacoesAtualizada += `Celular: ${data['celular']}|`;
                    }
                    if(data['referencia']) {
                        observacoesAtualizada += `Referência: ${data['referencia']}|`;
                    }
                    if(data['observacoes']) {
                        observacoesAtualizada += `Obs: ${data['observacoes']}|`;
                    }
                } else if(!agendar && estavaAgendada) {//quando entra aqui é porque o agendamento foi apagado
                    observacoesAtualizada += `Agendamento Cancelado: ${log}|`;
                }

                observacoesAtualizada = observacoesAtualizada + observacoesExistente;

                const matchObs = observacoesAtualizada.match(/\|/g);
                const nLinhas = (matchObs || []).length;
                
                //preenche com as linhas em branco que faltarem
                observacoesAtualizada += ('|').repeat(9 - (nLinhas > 9 ? 9 : nLinhas));
                observacoesAtualizada = observacoesAtualizada.split('|').slice(0, 10).join('|');

                //atualiza o cabecalho primeiro
                sql = `update ORDENS set
                    ORDENS_AGENDAMENTO    = '${agendar ? 'T' : 'F'}',
                    ORDENS_STATUS         = '${data['ORDENS_STATUS']}',
                    ORDENS_ID_USUARIOS    = '${data['ORDENS_ID_USUARIOS']}',
                    ORDENS_ID_ORDENSROTAS = '${data['ORDENS_ID_ORDENSROTAS']}',
                    ORDENS_OBSERVACOES    = '${observacoesAtualizada}',
                    ORDENS_LOG            = '${log}'
                where ORDENS_ID = '${id}'`;

                await db.query(sql);

                //depois atualiza os itens
                sql = `update ORDENSAVARIADOS set
                    ORDENSAVARIADOS_SITUACAO     = '${data['ORDENSAVARIADOS_SITUACAO']}',
                    ORDENSAVARIADOS_AGENDADA     = '${data['ORDENSAVARIADOS_AGENDADA'] || '1899-12-30'}',
                    ORDENSAVARIADOS_HORAAGENDADA = '${data['ORDENSAVARIADOS_HORAAGENDADA']}'
                    ${alocar ? `,
                        ORDENSAVARIADOS_LOCACAO      = '${moment.tz(params.timezone).format('YYYY-MM-DD')}',
                        ORDENSAVARIADOS_HORALOCACAO  = '${moment.tz(params.timezone).format('HH:mm:ss')}'
                    ` : data['ORDENS_ID_USUARIOS'] == '1' ? `,
                        ORDENSAVARIADOS_LOCACAO      = '1899-12-30',
                        ORDENSAVARIADOS_HORALOCACAO  = ''
                    ` : ''}
                where ORDENSAVARIADOS_ID_ORDENS = '${id}' `;
                
                await db.query(sql);

                const ordemAtualizada = await api.ordenssky().readById(id, params);
            
                samosFB.processarGravacao({db, results: ordemAtualizada.results, resolve, reject});
            } catch(error) {
                samosFB.enviarRespostaErro(`Erro ordenssky/processos/agendamento`, db, error, reject);
            }
        });
    }
};