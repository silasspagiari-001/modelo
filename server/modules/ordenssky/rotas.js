'use strict';

const samosFB = require('../services/samosFirebird');
const api     = require('.');
const moment  = require('moment-timezone');

const diasSemana = {
    1: 'SEGUNDA',
    2: 'TERCA',
    3: 'QUARTA',
    4: 'QUINTA',
    5: 'SEXTA',
    6: 'SABADO',
    7: 'DOMINGO'
}

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { dataInicial } = params;
            const db = await samosFB.conectarBancoAsync(params.client);

            try {
                const dataFinal = moment(dataInicial).add(6, 'days').format('YYYY-MM-DD');

                const sql = `select
                    ORDENSROTAS_ID,
                    ORDENSROTAS_ID_USUARIOS,
                    USUARIOS_LOGIN,
                    ORDENSROTAS_ID_CIDADES,
                    CIDADES_NOME,
                    ORDENSROTAS_DATA,
                    ORDENSROTAS_STATUS,
                    ORDENSROTAS_NOME,
                    ORDENSROTAS_LIMITE,
                    (select count(*) from ORDENS where ORDENS_ID_ORDENSROTAS = ORDENSROTAS_ID) as ALOCADAS
                from ORDENSROTAS 
                join USUARIOS on USUARIOS_ID = ORDENSROTAS_ID_USUARIOS
                join CIDADES  on CIDADES_ID  = ORDENSROTAS_ID_CIDADES
                where ORDENSROTAS_DATA >= '${dataInicial}' and 
                      ORDENSROTAS_DATA <= '${dataFinal}'
                order by ORDENSROTAS_ID `;
                
                const rotas = await db.query(sql);
                const cidades = rotas.reduce((res, rota) => {
                    const existente = res.find(r => r['ORDENSROTAS_ID_CIDADES'] == rota['ORDENSROTAS_ID_CIDADES']);
                    
                    if(!existente) {
                        res.push({
                            'CIDADES_NOME'          : rota['CIDADES_NOME'],
                            'ORDENSROTAS_ID_CIDADES': rota['ORDENSROTAS_ID_CIDADES']
                        });
                    }

                    return res;
                }, []);

                for (let i in cidades) {
                    for(let j in rotas) {
                        const rota = rotas[j];

                        if(rota['ORDENSROTAS_ID_CIDADES'] == cidades[i]['ORDENSROTAS_ID_CIDADES']) {
                            const dia      = moment(rota['ORDENSROTAS_DATA']);
                            const indexDia = dia.day();
                            const nomeDia  = diasSemana[indexDia];

                            cidades[i]['ROTAS_ID_'    + nomeDia] = rota['ORDENSROTAS_ID'];
                            cidades[i]['STATUS_'      + nomeDia] = rota['ORDENSROTAS_STATUS'];
                            cidades[i]['LIMITE_'      + nomeDia] = rota['ORDENSROTAS_LIMITE'];
                            cidades[i]['ALOCADAS_'    + nomeDia] = rota['ALOCADAS'];
                            cidades[i]['USUARIOS_ID_' + nomeDia] = rota['ORDENSROTAS_ID_USUARIOS'];
                            cidades[i]['USUARIOS_'    + nomeDia] = rota['USUARIOS_LOGIN'];
                        }
                    }

                    for (let dia of Object.keys(diasSemana)) {
                        const nomeDia  = diasSemana[dia];

                        if(!cidades[i]['ROTAS_ID_' + nomeDia]) {
                            cidades[i]['ROTAS_ID_'    + nomeDia] = '';
                            cidades[i]['STATUS_'      + nomeDia] = '';
                            cidades[i]['LIMITE_'      + nomeDia] = '';
                            cidades[i]['USUARIOS_ID_' + nomeDia] = '';
                            cidades[i]['USUARIOS_'    + nomeDia] = '';
                        }
                    }
                }

                samosFB.processarLeitura({ db, results: cidades, total: cidades.length, resolve, reject });
            } catch(error) {
                samosFB.enviarRespostaErro(`Erro rotas/read`, db, error, reject);
            }
        });
    },

    create: (objData, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let executeBlock = '';

            try {
                const dataInicial = params.dataInicial;
                const listGravar  = [];

                for (let i in objData) {
                    const cidade = objData[i];

                    for (let dia of Object.keys(diasSemana)) {
                        const nomeDia  = diasSemana[dia];

                        if(cidade['USUARIOS_ID_'    + nomeDia]) {
                            const id = cidade['ROTAS_ID_'    + nomeDia] || await samosFB.lastId(db, 'ORDENSROTAS', 'GEN_ORDENSROTAS_ID', 'ORDENSROTAS_ID');

                            listGravar.push({
                                'ORDENSROTAS_ID'          : id,
                                'ORDENSROTAS_STATUS'      : cidade['STATUS_'      + nomeDia],
                                'ORDENSROTAS_LIMITE'      : cidade['LIMITE_'      + nomeDia],
                                'ORDENSROTAS_ID_USUARIOS' : cidade['USUARIOS_ID_' + nomeDia],
                                'ORDENSROTAS_ID_CIDADES'  : cidade['ORDENSROTAS_ID_CIDADES'],
                                'ORDENSROTAS_NOME'        : (cidade['CIDADES_NOME'] || '').toUpperCase().replace(/'/ig, ''),
                                'ORDENSROTAS_DATA'        : moment(dataInicial).add(dia - 1).format('YYYY-MM-DD')
                            });
                        }
                    }
                }

                const sql = listGravar.map(obj => {
                    return `update or insert into ORDENSROTAS (
                        ORDENSROTAS_ID,
                        ORDENSROTAS_ID_USUARIOS,
                        ORDENSROTAS_ID_CIDADES,
                        ORDENSROTAS_STATUS,
                        ORDENSROTAS_NOME,
                        ORDENSROTAS_LIMITE,
                        ORDENSROTAS_DATA
                    ) values (
                        '${obj['ORDENSROTAS_ID']}',
                        '${obj['ORDENSROTAS_ID_USUARIOS']}',
                        '${obj['ORDENSROTAS_ID_CIDADES']}',
                        '${obj['ORDENSROTAS_STATUS']}',
                        '${obj['ORDENSROTAS_NOME']}',
                        '${obj['ORDENSROTAS_LIMITE']}',
                        '${obj['ORDENSROTAS_DATA']}'
                    )`;
                })
                .reduce((result, sql) => {
                    return `${result} ${sql}; `;
                }, '');

                executeBlock = `execute block as begin ${sql} end;`;

                await db.query(executeBlock);

                if(params.realocar && params.tecnico) {
                    //realocacao de ordem alterada
                    await db.query(`
                        update ORDENS 
                        set ORDENS_ID_USUARIOS = '${params.tecnico}' 
                        where ORDENS_ID_ORDENSROTAS = '${params.realocar}'
                    `);
                }

                const search = await api.ordensrotas().read(params);
                const results = search.results;

                samosFB.processarLeitura({ db, results, total: results.length, resolve, reject });
            } catch(error) {
                samosFB.enviarRespostaErro(`Erro rotas/read`, db, error, reject, executeBlock);
            }
        })
    },

    update: (id, cidade, params) => {//usado para os itens individualmente
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let executeBlock = '';

            try {
                const dataInicial = params.dataInicial;
                const listGravar  = [];

                for (let dia of Object.keys(diasSemana)) {
                    const nomeDia  = diasSemana[dia];

                    if(cidade['USUARIOS_ID_'    + nomeDia]) {
                        const id = cidade['ROTAS_ID_'    + nomeDia] || await samosFB.lastId(db, 'ORDENSROTAS', 'GEN_ORDENSROTAS_ID', 'ORDENSROTAS_ID');

                        listGravar.push({
                            'ORDENSROTAS_ID'          : id,
                            'ORDENSROTAS_STATUS'      : cidade['STATUS_'      + nomeDia],
                            'ORDENSROTAS_LIMITE'      : cidade['LIMITE_'      + nomeDia],
                            'ORDENSROTAS_ID_USUARIOS' : cidade['USUARIOS_ID_' + nomeDia],
                            'ORDENSROTAS_ID_CIDADES'  : cidade['ORDENSROTAS_ID_CIDADES'],
                            'ORDENSROTAS_NOME'        : (cidade['CIDADES_NOME'] || '').toUpperCase().replace(/'/ig, ''),
                            'ORDENSROTAS_DATA'        : moment(dataInicial).add(dia - 1).format('YYYY-MM-DD')
                        });
                    }
                }

                const sql = listGravar.map(obj => {
                    return `update or insert into ORDENSROTAS (
                        ORDENSROTAS_ID,
                        ORDENSROTAS_ID_USUARIOS,
                        ORDENSROTAS_ID_CIDADES,
                        ORDENSROTAS_STATUS,
                        ORDENSROTAS_NOME,
                        ORDENSROTAS_LIMITE,
                        ORDENSROTAS_DATA
                    ) values (
                        '${obj['ORDENSROTAS_ID']}',
                        '${obj['ORDENSROTAS_ID_USUARIOS']}',
                        '${obj['ORDENSROTAS_ID_CIDADES']}',
                        '${obj['ORDENSROTAS_STATUS']}',
                        '${obj['ORDENSROTAS_NOME']}',
                        '${obj['ORDENSROTAS_LIMITE']}',
                        '${obj['ORDENSROTAS_DATA']}'
                    )`;
                })
                .reduce((result, sql) => {
                    return `${result} ${sql}; `;
                }, '');

                executeBlock = `execute block as begin ${sql} end;`;

                await db.query(executeBlock);

                samosFB.processarLeitura({ db, results: [cidade], total: 1, resolve, reject });
            } catch(error) {
                samosFB.enviarRespostaErro(`Erro rotas/read`, db, error, reject, executeBlock);
            }
        })
    }
};