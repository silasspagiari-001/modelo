'use strict';

const path     = require('path');
const appRoot  = path.dirname(require.main.filename);
const fs       = require('fs/promises');
const utils    = require('../../../services/samosUtils');
const samosFB  = require('../../../services/samosFB');
const { exec } = require('child_process');

module.exports = {
    create: async (data, params) => {

        const apiexe = process.env[params.client ? ((params.client || '').toUpperCase() + '_APINFE') : 'APINFE'];
        
        let caminhoApi;

        if(params.client == '') {
            caminhoApi = 'C:/ACBrLazarus'; // Desenvolvimento
        } else {
            caminhoApi = appRoot.replace('\\server', '\\apisamos').replace('\/server', '\/apisamos'); // Produção
        }

        const { type, method, id, guid, evento, barras } = data;
        const client = params.client == 'edular' ? 'prudenmoveis' : (params.client || 'racaforte');

        let strChamada = '';

        if(type == 'notaeletronica' && (method || '').match(/correcao/)) {
            strChamada = `${caminhoApi}/${apiexe} "${type}|${method}|${data.idMovimento}|${data.idCarta}|0|${guid}|${client}"`;
        } 

        if (type === 'notaeletronica' && !(method || '').match(/correcao/)) {
            strChamada = `${caminhoApi}/${apiexe} "${type}|${method}|${id}|0|${guid}|${client}"`;
        }

        if(type == 'notaconsumidor') {
            strChamada = `${caminhoApi}/${apiexe} "${type}|${method}|${id}|0|${guid}|${client}"`;            
        }

        if(type == 'manifestos') {
            strChamada = `${caminhoApi}/${apiexe} "${type}|${method}|${id}|0|${guid}|${client}"`;            
        }

        if(type == 'processos' && method == 'manifestar') {
            strChamada = `${caminhoApi}/${apiexe} "${type}|${method}|${evento}|${barras}|${guid}|${client}"`;
        }
        
        let resposta = '';

        console.log('chamada: ', strChamada);

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

            const caminhoArquivo = `${caminhoApi}/${guid}.log`;

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
                
                if(method == 'email') {
                    return [JSON.parse(resposta)];
                } else {
                    return [{data: JSON.parse(resposta)}];
                }

            } else {
                return [{data: {}}];
            }
        } catch (error) {
            console.log(error);
        }
    }
};