'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs/promises');
//const mkdirp    = require('mkdirp');
//const utils     = require('../../../services/samosUtils');
//const samosFB   = require('../../../services/samosFB');
const retornoBB = require('../../../services/retornobbcnab');
const moment    = require('moment-timezone');
const { exec }  = require('child_process');

module.exports = {
    create: async (data, params) => {

        let caminhoApi;

        if(params.client == '') {
            caminhoApi = 'C:/ACBrLazarus'; // Desenvolvimento
        } else {
            caminhoApi = appRoot.replace('\\server', '\\apisamos').replace('\/server', '\/apisamos'); // Produção
        }

        const { task, empresa, portador, ids, inicio, final, guid, arquivo } = data;
        const client = (params.client || 'racaforte');

        let strChamada;

        if(task == 'processarapi') {
            strChamada = `${caminhoApi}/apisamos "financeiros|${task}|${empresa}|${portador}|${inicio}|${final}|${guid}|${client}"`;
        }

        if(task == 'boletos') {
            const nomeArquivo = `${guid}.emi`;        
            try {
                const caminhoCompleto = `${caminhoApi}`;
        
                await fs.mkdir(caminhoCompleto, { recursive: true });
            
                await fs.writeFile(
                    `${caminhoCompleto}/${nomeArquivo}`,
                    ids,
                    'utf8'
                );
        
            } catch (err) {
                console.error('Erro ao gravar arquivo para emissão:', err);
            }

            strChamada = `${caminhoApi}/apisamos "financeiros|${task}|${empresa}|${portador}|${nomeArquivo}|${guid}|${client}"`;
        }

        if (task === 'remessas') {
            const nomeArquivo = `${guid}.rem`;        
            try {
                const caminhoCompleto = `${caminhoApi}`;
        
                await fs.mkdir(caminhoCompleto, { recursive: true });
            
                await fs.writeFile(
                    `${caminhoCompleto}/${nomeArquivo}`,
                    ids,
                    'utf8'
                );
        
            } catch (err) {
                console.error('Erro ao gravar arquivo de remessa:', err);
            }
        
            strChamada = `${caminhoApi}/apisamos "financeiros|${task}|${empresa}|${portador}||${guid}|${client}"`;
        }        

        if (task === 'retorno' && client != 'racaforte') {  // Só raçaforte lê o CNAB direto sem apisamos pra montar francesinha
            const nomeArquivo = `${guid}.ret`;        
            try {
                const caminhoCompleto = `${caminhoApi}/retorno/${client}/${portador}`;

                console.log('caminhoCompleto: ', caminhoCompleto, ' Arquivo: ', nomeArquivo);
        
                await fs.mkdir(caminhoCompleto, { recursive: true });
            
                await fs.writeFile(
                    `${caminhoCompleto}/${nomeArquivo}`,
                    arquivo,
                    'utf8'
                );
        
            } catch (err) {
                console.error('Erro ao gravar arquivo de retorno:', err);
            }

            strChamada = `${caminhoApi}/apisamos "financeiros|${task}|${empresa}|${portador}||${guid}|${client}"`;
        }        

        if (task === 'baixar') {
            const nomeArquivo = `${guid}.ret`;        
            try {
                const caminhoCompleto = `${caminhoApi}`;
        
                await fs.mkdir(caminhoCompleto, { recursive: true });
            
                await fs.writeFile(
                    `${caminhoCompleto}/${nomeArquivo}`,
                    arquivo,
                    'utf8'
                );
        
            } catch (err) {
                console.error('Erro ao gravar arquivo de baixas:', err);
            }
        
            strChamada = `${caminhoApi}/apisamos "financeiros|${task}|${empresa}|${portador}||${guid}|${client}"`;
        }        

        let resposta = '';

        if (task === 'retorno' && client == 'racaforte') {  // apenas raçaforte lê o CNAB direto via /services/retornobbcnab.
            const arquivoCnab = data.arquivo;
            const arquivoJSON = retornoBB.parseArquivo(arquivoCnab); // Faz a conversão.
            console.log('arqJSON: ', arquivoJSON);
            return arquivoJSON;
        } else {  // demais tasks - executam normalmente remessa/retorno/processarapi via apisamos
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
    
                const maxTentativas = 75;
                const intervalo = 4000;
    
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
    
                    if(task == 'retorno' || task == 'remessas') {
                        return JSON.parse(resposta);
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
    }
};