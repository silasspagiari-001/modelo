'use strict';

const path           = require('path');
const appRoot        = path.dirname(require.main.filename);
const fs             = require('fs');
const moment         = require('moment-timezone');
const mkdirp         = require('mkdirp');
const api            = require('../');
const utils          = require('../../services/samosUtils'); 
const JSZip          = require('jszip');

moment.locale('pt_BR');

const samosFB = require('../../services/samosFirebird'); 

//Criar pastas necessarias
async function createDirectories(pastaSalvarZip)
{
    if( !fs.existsSync( path.join(appRoot, 'public', pastaSalvarZip) ) )
    {
        //Cria as pastas
        mkdirp( path.join(appRoot, 'public', pastaSalvarZip) );
    }
}

//Gerar arquivo ZIP
async function createZip(pdfsPaths, pastaSalvarZip, nomeZip)
{
    return new Promise( async function(resolve, reject){
        const zip = new JSZip();
        const pathGravarZIP =  path.join(appRoot, 'public', pastaSalvarZip, nomeZip);

        //Pra cada PDF gerado na pasta, adiciona o PDF ao ZIP
        for( let i = 0 ; i < pdfsPaths.length ; i++ )
        {
            const pdfFile = pdfsPaths[i];
            const pdfData = fs.readFileSync( path.join(appRoot, pdfFile).split('\\').join('/') );

            zip.file( path.basename(pdfFile), pdfData );
        }

        //Grava o arquivo ZIP
        zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
            .pipe(fs.createWriteStream(pathGravarZIP))
            .on('finish', function () {
                resolve(zip);
            });
    } );
}

//Implementado do sencha Ext.apply
function aplicarParametros(object, config)
{
	if (object && config && typeof config === 'object') {
		let i, j, k;
		for (i in config) {
			object[i] = config[i];
		}
	}
	return object;
}

module.exports = {
    read: async params => { 
        return new Promise( async function(resolve, reject){
            try{
                //Buscar todas as notas eletronicas do periodo
                const notas = (params.ids ? params.ids.split(',') : []) || [];
                const pdfsGerados = [];
                //Usa o DANFE da nota eletronica para o cliente
                const nomeCliente    = params.clientNameConfig;
                const convenioLocal  = params.convenioLocalConfig;
                const apiDanfe       = api[`docsfiscais/${nomeCliente}/danfe`]();
                const momentoBusca   = new Date().getTime();

                //Para cada nota eletronica
                for( let i = 0 ; i < notas.length ; i++ )
                {
                    const idBuscar    = notas[i];
                    const nota        = (await api.movimentos().readById(idBuscar, params)).results[0];
                    const statusNota  = nota['MOVIMENTOS_STATUS'];

                    //Filtra as que não estão canceladas nem denegadas, etc...
                    if( 
                        nota['MOVIMENTOS_NFE'].length > 0 && 
                        nota['MOVIMENTOS_PROTOCOLO'].length > 0 &&
                        statusNota != 'C' &&
                        statusNota != 'D' &&
                        statusNota != 'R' &&
                        statusNota != 'B'
                    ){
                        const idNota  = idBuscar;
                        const isLocal = nota['MOVIMENTOS_ID_PROPRIEDADES'] > 0 ? 
                                        (nota['CIDADES_ESTADOEMPRESA'] == nota['CIDADES_ESTADOPROPRIEDADE']) :
                                        (nota['CIDADES_ESTADOEMPRESA'] == nota['CIDADES_ESTADO']);
                        const convenio = (isLocal ? convenioLocal : convenioLocal);
                        const nomePessoa  = String( utils.string.clearSpecial( nota['MOVIMENTOS_NOME'], true ) ).replace(/\\/g, '').replace(/ /g, '-');
                        const numeroNota  = nota['MOVIMENTOS_NUMERO'];
                        const serieNota   = nota['MOVIMENTOS_SERIE'];
                        const nomeArquivo = `${numeroNota}-${serieNota}-${nomePessoa}`;
                        //const nomeArquivo = `${numeroNota}${serieNota}`;

                        //Salva todos os PDFs gerados numa pasta de maneira organizada
                        const caminhoPdf = await apiDanfe.readById(
                            idNota, 
                            aplicarParametros(params, {
                                convenio: convenio,
                                useCustomPdfName: true,
                                customPdfPath: `pdfnotagerados/${nomeCliente}/${momentoBusca}`,
                                customPdfName: nomeArquivo
                            })
                        );

                        pdfsGerados.push( caminhoPdf.results[0].name );
                    }
                }

                //Cria as pastas e subpastas
                await createDirectories( path.join('zip', nomeCliente) );

                setTimeout( async()=>{
                    //Cria um arquivo ZIP
                    const zipObject = await createZip(pdfsGerados, path.join('zip', nomeCliente), `NFEs-${momentoBusca}.zip`);

                    //Para cada nota, Identifica quais são as notas de correção dela, porem haver mais de uma por nota
                    const notasCorrecao = {

                    };

                    //Retorna um array de caminhos dos PDFs gerados
                    resolve({
                        pdfs: pdfsGerados,
                        zipped: path.join('public', 'zip', nomeCliente, `NFEs-${momentoBusca}.zip`).split('\\').join('/'),
                        zippedName: `NFEs-${momentoBusca}.zip`
                    });

                }, 1200 );

            }catch(erro){
                reject(erro);
                throw erro;
            }
        } )
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