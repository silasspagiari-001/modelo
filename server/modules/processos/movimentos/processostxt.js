'use strict';

const path     = require('path');
const appRoot  = path.dirname(require.main.filename);
const fs       = require('fs/promises');
const utils    = require('../../../services/samosUtils');
const samosFB  = require('../../../services/samosFB');
const { exec, execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

module.exports = {
    create: async (data, params) => {

        let caminhoApi;

        if(params.client == '') {
            caminhoApi = 'C:/ACBrLazarus'; // Desenvolvimento
        } else {
            caminhoApi = appRoot.replace('\\server', '\\apisamos').replace('\/server', '\/apisamos'); // Produção
        }

        const { type, method, ids, empresa, cnpj, mes, ano, preco, guid } = data;
        const client = (params.client || 'prudenart');

        let strChamada = '';

        if(type == 'processos' && (method == 'spedfiscal' || method == 'spedpiscofins')) {
            strChamada = `${caminhoApi}/apisamos "${type}|${method}|${ids}|${mes}|${ano}|${preco}|${guid}|${client}"`;
        } 

        if(type == 'processos' && method == 'enviarxml' ) {
            strChamada = `${caminhoApi}/apisamos "${type}|${method}|${cnpj}|${mes}|${ano}|${guid}|${client}"`;            
        }

        let resposta = '';

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

            const maxTentativas = 90;
            const intervalo = 20000;

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

            console.log('resposta: ', resposta);

            if(resposta) {

                try {
                    await fs.unlink(caminhoArquivo);
                } catch (err) {
                    console.error('Erro ao apagar arquivo:', err);
                }

                if(type == 'processos' && method == 'enviarxml') {  // Envio XML Contabilidade
                    const respostaObj = JSON.parse(resposta);

                    let arquivosResultantes = respostaObj.arquivo.split('|') || [];

                    await fs.mkdir(`${appRoot}/public/zip`, { recursive: true });

                    // XMLs de saída gerados pela API Samos
                    for(let i in arquivosResultantes) {
                        if(arquivosResultantes[i] != '') {
                            const arquivoProcesso = arquivosResultantes[i];
                            try {
                                await fs.copyFile(`${caminhoApi}/tmp/${arquivoProcesso}`, `${appRoot}/public/zip/${arquivoProcesso}`);
                                console.log('Arquivo de saída copiado com sucesso!');
                            } catch (err) {
                                console.error('Erro ao copiar XML de saída:', err);
                            }
                        }
                    }

                    // XMLs de entrada recebidos de fornecedores.
                    // Ex.: public/xmlentrada/64607922000144/2026/09/*.xml
                    respostaObj.arquivoEntrada = '';

                    try {
                        const cnpjLimpo = String(cnpj || '').replace(/\D/g, '');
                        const anoLimpo  = String(ano || '').replace(/\D/g, '');
                        const mesLimpo  = String(mes || '').replace(/\D/g, '').padStart(2, '0');

                        const pastaXmlEntrada = path.join(
                            appRoot,
                            'public',
                            'xmlentrada',
                            cnpjLimpo,
                            anoLimpo,
                            mesLimpo
                        );

                        let arquivosEntrada = [];

                        try {
                            const itensPasta = await fs.readdir(pastaXmlEntrada, { withFileTypes: true });

                            arquivosEntrada = itensPasta
                                .filter(item => item.isFile() && path.extname(item.name).toLowerCase() === '.xml')
                                .map(item => path.join(pastaXmlEntrada, item.name));
                        } catch (err) {
                            if(err.code !== 'ENOENT') {
                                throw err;
                            }
                            // Pasta inexistente: segue normalmente somente com os XMLs de saída.
                        }

                        if(arquivosEntrada.length > 0) {
                            const nomeZipEntrada = `XML_ENTRADA_${cnpjLimpo}_${anoLimpo}_${mesLimpo}.zip`;
                            const caminhoZipEntrada = path.join(appRoot, 'public', 'zip', nomeZipEntrada);

                            // Remove um ZIP anterior do mesmo CNPJ/período, caso exista.
                            await fs.unlink(caminhoZipEntrada).catch(err => {
                                if(err.code !== 'ENOENT') throw err;
                            });

                            // Usa caminho absoluto do executável porque o PATH do processo PM2
                            // pode ser diferente do shell do usuário root. Executamos dentro da
                            // própria pasta de XMLs para passar somente os nomes dos arquivos.
                            const nomesArquivosEntrada = arquivosEntrada.map(arquivo => path.basename(arquivo));

                            console.log(`XML ENTRADA: ${arquivosEntrada.length} XML(s) encontrado(s) para ${cnpjLimpo}/${anoLimpo}/${mesLimpo}`);
                            console.log(`XML ENTRADA: gerando ${caminhoZipEntrada}`);

                            const resultadoZip = await execFileAsync(
                                '/usr/bin/zip',
                                ['-j', caminhoZipEntrada, ...nomesArquivosEntrada],
                                { cwd: pastaXmlEntrada, maxBuffer: 10 * 1024 * 1024 }
                            );

                            // Confirma fisicamente que o ZIP existe antes de devolvê-lo ao ExtJS.
                            await fs.access(caminhoZipEntrada);

                            respostaObj.arquivoEntrada = nomeZipEntrada;
                            console.log(`XML ENTRADA: ZIP criado com sucesso: ${nomeZipEntrada}`);
                            console.log(`XML ENTRADA: adicionado ao retorno para envio por e-mail`);

                            if(resultadoZip.stderr) {
                                console.log('XML ENTRADA zip stderr:', resultadoZip.stderr);
                            }
                        } else {
                            console.log(`Nenhum XML de entrada encontrado para ${cnpjLimpo}/${anoLimpo}/${mesLimpo}`);
                        }

                    } catch (err) {
                        // Falha ao gerar o ZIP de entrada não bloqueia o envio dos XMLs de saída.
                        console.error('Erro ao gerar ZIP dos XMLs de entrada:', err);
                        respostaObj.arquivoEntrada = '';
                    }

                    // Atualiza a resposta para o ExtJS receber também o ZIP de entrada, quando houver.
                    resposta = JSON.stringify(respostaObj);
                }

                if(type == 'processos' && method != 'enviarxml') {  // Sped/zip, etc.
                    const respostaObj = JSON.parse(resposta);
                    const arquivoProcesso = respostaObj.arquivo;
                    try {
                        await fs.copyFile(`${caminhoApi}/tmp/${arquivoProcesso}`, `${appRoot}/public/zip/${arquivoProcesso}`);
                        console.log('Arquivo copiado com sucesso!');
                    } catch (err) {
                        console.error('Erro ao copiar:', err);
                    }
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