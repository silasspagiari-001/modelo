'use strict';

const path    = require('path');
const appRoot = path.dirname(require.main.filename);
const fs      = require('fs/promises');
const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const api     = require('../..');
const moment  = require('moment-timezone');
const { exec } = require('child_process');

module.exports = {
    update: async (numero, data, params) => {

        console.log('numero: ', numero, ' data: ', data, ' params: ', params);

        let caminhoApi;

        if(params.client == '') {
            caminhoApi = 'C:/ACBrLazarus'; // Desenvolvimento
        } else {
            caminhoApi = appRoot.replace('\\server', '\\apisamos').replace('\/server', '\/apisamos'); // Produção
        }

        const client     = (params.client || 'racaforte');
        const empresa    = params.empresaLogada
        const serie      = data['serieReferencia'];
        const strChamada = `${caminhoApi}/apisamos "notaeletronica|inutilizar|${empresa}|${numero}|${numero}|${data.mesReferencia}|${data.anoReferencia}|${data.guid}|${client}"`;
        let resposta     = '';
console.log('strChamada: ', strChamada);

        return;
        try {

            exec(
                `${strChamada}`,
                (error, stdout, stderr) => {

                    if (error) {
                        console.error(`Erro: ${error.message}`);
                    }

                    if (stderr) {
                        console.error(`stderr: ${stderr}`);
                    }

                }
            );

            const caminhoArquivo = `${caminhoApi}/${data.guid}.log`;

            const maxTentativas = 10;
            const intervalo = 2000;

            for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {

                try {

                    await fs.access(caminhoArquivo);

                    resposta = await fs.readFile(caminhoArquivo, 'utf8');


                    break;

                } catch (err) {


                    if (tentativa < maxTentativas) {
                        await new Promise(resolve => setTimeout(resolve, intervalo));
                    }

                }

            }

            if(resposta) {
                try {
                    await fs.unlink(caminhoArquivo);
                } catch (err) {
                    console.error('Erro ao apagar arquivo:', err);
                }

                try {                   
                    const sqlNotaChecar = `select MOVIMENTOS_ID, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO,
                                                  MOVIMENTOS_PROTOCOLO from MOVIMENTOS
                                           where MOVIMENTOS_ID_EMPRESAS = ${empresa} and
                                                 MOVIMENTOS_ID_DOCUMENTOS = ${empresa}0003 and
                                                 MOVIMENTOS_NUMERO = ${numero} and
                                                 MOVIMENTOS_SERIE = '${serie}'
                                           order by MOVIMENTOS_NUMERO`;

                    const notaEncontrada = await samosFB.executeSQL(sqlNotaChecar, params);

                    if(notaEncontrada.length > 0) {
                        if(notaEncontrada[0]['MOVIMENTOS_PROTOCOLO'] != '') {
                            msg = 'Nota tem número de protocolo - inutilização não permitida';
                            throw { msg, error };                            
                        }
                        const id = notaEncontrada[0]['MOVIMENTOS_ID'];
                        const sqlItens = `select MOVIMENTOSITENS_ID_PRODUTOS, MOVIMENTOS_ID_EMPRESAS
                                            from MOVIMENTOSITENS 
                                            join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                            where MOVIMENTOSITENS_ID_MOVIMENTOS = ${id}`;  // Guarda pra atualizar o saldo

                        const resultsItens = await samosFB.executeSQL(sqlItens, params);

                        const sql = `execute block as
                                        begin
                                            delete from MOVIMENTOS        where MOVIMENTOS_ID                   = ${id};
                                            delete from MOVIMENTOSITENS   where MOVIMENTOSITENS_ID_MOVIMENTOS   = ${id};
                                            delete from MOVIMENTOSCAIXA   where MOVIMENTOSCAIXA_ID_MOVIMENTOS   = ${id};
                                            delete from CARTOES           where CARTOES_ID_MOVIMENTOS           = ${id};
                                            delete from CHEQUES           where CHEQUES_ID_MOVIMENTOS           = ${id};
                                            delete from FINANCEIROS       where FINANCEIROS_ID_MOVIMENTOS       = ${id};
                                            delete from MOVIMENTOSENVIO   where MOVIMENTOSENVIO_ID_MOVIMENTOS   = ${id};
                                            delete from MOVIMENTOSCARTAS  where MOVIMENTOSCARTAS_ID_MOVIMENTOS  = ${id};
                                            delete from RELACOESITENS     where RELACOESITENS_ID_MOVIMENTOS     = ${id};
                                        end;`;
                            
                        await samosFB.executeSQL(sql, params);            

                        if(resultsItens.length > 0) { // por último atualiza os saldos dos produtos da nota
                            await api['processos/atualizasaldo']().create({
                                empresa : results[0]['MOVIMENTOS_ID_EMPRESAS'],
                                produtos: (results || []).map(item => item['MOVIMENTOSITENS_ID_PRODUTOS']),
                                client  : params.client
                            });    
                        }



                    }

                    const logInutilizar = {
                        'LOGS_STATUS'       : 'I',
                        'LOGS_IP'           : params.ip,
                        'LOGS_ID_PESSOAS'   : params.userId,
                        'LOGS_DATA'         : hoje,
                        'LOGS_HORA'         : moment.tz(params.timezone).format('HH:mm:ss'),
                        'LOGS_NOME'         : `Inutilização numeração NF: ${numero} - ${params.serieReferencia} - Referente: ${mesReferencia}/${anoReferencia}`
                    }

                    await samosFB.insert('LOGS', logInutilizar, params);

                } catch (err) {
                    console.error('Falha ao processar inutilização:', err);
                }
                
                return [{data: JSON.parse(resposta)}];

            } else {
                return [{data: {}}];
            }
        } catch(error) {
            const msg = 'Falha ao processar inutilização';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};