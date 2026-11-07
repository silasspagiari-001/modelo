'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const codes = require('rescode');
const MesExtenso = [
    "JANEIRO",
    "FEVEREIRO",
    "MARÇO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO"
];

let mesReferencia;
let impressos = 0;

codes.loadModules(["qrcode"], {"includetext" : false});

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [15, 5, 10, 5], // [20, 20, 20, 25],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableReport',
					table: {   //[Canhoto] D   [ Ficha           ]
						       // 1   2    3   4   5   6   7   8   9
						widths: [70, 70,   5, 40, 50, 40, 40, 20, 110],
						body: []
					}
				}
			],
			styles: {
				tableReport: {
					fontSize: 9,  //10
					margin: [15, 5, 10, 5] // [20, 20, 20, 25]
				},
				tableHeader: {
					bold: true,
					fontSize: 9,  //10
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.financeiros().readById(params.ids, params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){

						let model = res.results[i];

						let barcodes  = await getQrcode(completeChars(model['FINANCEIROS_ID_EMPRESAS'], 3) + completeChars(model['FINANCEIROS_NUMERO'], 7) + completeChars(model['FINANCEIROS_PARCELA'], 3));

						let pessoaFan = ((model['EMPRESAS_FANTASIA'] || '').match(/FT/) || !model['PESSOAS_FANTASIA']) ? '' : ` (${model['PESSOAS_FANTASIA']})`

						mesReferencia = MesExtenso[(parseInt(moment(model['FINANCEIROS_VENCIMENTO']).format('M')) - 1)] + '/' +
						                moment(model['FINANCEIROS_VENCIMENTO']).format('YYYY')

						let pathLogo;

						try {
							pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
						} catch(error) {
							pathLogo = `${appRoot}/resources/images/headers/default.png`;
						}

						let pathFone  = `${appRoot}/resources/images/headers/telefone.png`
						let pathWhats = `${appRoot}/resources/images/headers/whatsapp.png`	

						rows.push([  // linha de cabeçalho fixa
							{
								text: '- '.repeat(120),
								fontSize: 8,
								colSpan: 9,
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{}
						]);	

						rows.push([
							{
								image: pathLogo,
								width: 60,
								alignment: 'left',
								border: [false, false, true, true]
							},
							{
								text: 'RECIBO DO SACADO',
								style: {fontSize: 8},
								border: [true, false, false, true]
							},							
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								image: pathLogo,
								width: 60,
								colSpan: 6,								
								alignment: 'left',
								border: [false, false, false, true]
							},{},{},{},{},{}
						],
						[
							{
								text: [
									{
										text: 'CEDENTE:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['EMPRESAS_FANTASIA'],
										alignment: 'left',
										style: {bold: true}
									}
								],
								style: 'tableExample',
								colSpan: 2,
								border: [false, true, false, true]
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'LOCAL DE PAGAMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['EMPRESAS_FANTASIA'],
										alignment: 'left',
										style: {bold: true}
									}
								],
								border: [false, true, true, true],								
								colSpan: 5,
								style: 'tableExample'
							},{},{},{},{},
							{
								text: [
									{
										text: 'VENCIMENTO: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]
							}
						],
						[
							{
								text: [
									{
										text: 'SACADO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['PESSOAS_NOME'],
										fontSize: ((model['PESSOAS_NOME'] + pessoaFan).length > 30 ? 7 : 9),
										alignment: 'left',
										style: {bold: true}
									}
								],
								border: [false, true, false, true],								
								colSpan: 2
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'CEDENTE:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['EMPRESAS_NOME'],
										alignment: 'left',
										style: {bold: true}
									}
								],
								border: [false, true, true, true],
								colSpan: 5,
								style: 'tableExample'
							},{},{},{},{},
							{
								text: [
									{
										text: 'PARCELA: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('00' + model['FINANCEIROS_PARCELA']).slice(-2) + '/' +
										      ('00' + model['FINANCEIROS_PARCELAS']).slice(-2),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]								
							}
						],
						[
							{
								text: [
									{
										text: 'PARCELA:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('00' + model['FINANCEIROS_PARCELA']).slice(-2) + '/' +
										      ('00' + model['FINANCEIROS_PARCELAS']).slice(-2),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [false, true, true, true]
							},
							{
								text: [
									{
										text: 'VENCIMENTO: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]									
							},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'DATA DE EMISSAO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: moment(res.results[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [false, true, true, true],								
								colSpan: 2
							},{},
							{
								text: [
									{
										text: 'ESPÉCIE:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: 'CARNÊ',
										alignment: 'center',
										style: {bold: true}
									}
								],
								style: 'tableExample'
							},{
								text: [
									{
										text: 'MOEDA:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: 'REAL',
										alignment: 'center',
										style: {bold: true}
									}
								],
								colSpan: 2,
								style: 'tableExample'
							},{},
							{
								text: [
									{
										text: 'N.DOCUMENTO: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('000000' + model['FINANCEIROS_NUMERO']).slice(-6),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]
							}
						],
						[
							{
								text: [
									{
										text: '(=) VALOR DO DOCUMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: utils.number.float2moeda(model['FINANCEIROS_ORIGINAL']),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [false, true, false, true],								
								colSpan: 2
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: `${model['EMPRESAS_ENDERECO']}, ${model['EMPRESAS_NUMERO']} - ${model['EMPRESAS_BAIRRO']}\n${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}`,
										alignment: 'left'
									}
								],
								border: [false, true, false, false],								
								colSpan: 5
							},{},{},{},{},
							{
								text: [
									{
										text: '(=) VALOR DO DOCUMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: utils.number.float2moeda(model['FINANCEIROS_ORIGINAL']),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]								
							}
						],		
						[
							{
								text: [
									{
										text: '(-) DESCONTO/ABATIMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								colSpan: 2,
								border: [false, true, false, true]								
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
								alignment: 'center',
								border: [false, false, false, false]
							},
							{  // Cidade e telefone do carnê
								table: {
									body: [
										[	
											{
												image: pathFone,
												width: 13,  //10 all
												height: 13	
											},
											{
												text: utils.string.maskFone(model['EMPRESAS_TELEFONE']),
												style: {fontSize: 9, bold: true}
											},																
											{
												image: pathWhats,
												width: 13,
												height: 13	
											},
											{
												text: utils.string.maskFone(model['EMPRESAS_CELULAR']),
												style: {fontSize: 9, bold: true}																	
											}
										]
									]														
								},
								layout: 'noBorders',													
								colSpan: 5,
								border: [false, false, false, false]
							},{},{},{},{},
							{
								text: [
									{
										text: '(-) DESCONTO/ABATIMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								border: [true, true, false, true]								
							}
						],
						[
							{
								text: [
									{
										text: '(+) MORA/MULTA:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								colSpan: 2,
								border: [false, true, false, true]								
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
								alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: '(PAGUE EM DIA! EVITE PAGAR JUROS)',
								colSpan: 5,
								border: [false, false, true, false]
							},{},{},{},{},
							{
								text: [
									{
										text: '(+) MORA/MULTA:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								border: [true, true, false, true]								
							}
						],
						[
							{
								text: [
									{
										text: 'VALOR COBRADO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'left',
										style: {color: 'white'}
									}
								],
								border: [false, true, false, true],
								colSpan: 2
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'SACADO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['PESSOAS_NOME'] + pessoaFan,
										alignment: 'left',
										fontSize: ((model['PESSOAS_NOME'] + pessoaFan).length > 30 ? 7 : 9),										
										style: {bold: true}
									}
								],
								colSpan: 5,
								border: [false, true, true, true]
							},{},{},{},{},
							{
								text: [
									{
										text: '(=) VALOR COBRADO: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								border: [true, true, false, true]								
							}
						],
						[
							{
								text: [
									{
										text: 'N.DOCUMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('000000' + model['FINANCEIROS_NUMERO']).slice(-6),
										alignment: 'right',
										style: {bold: true}
									}
								],
								border: [false, true, true, true]								
							},
							{
								text: [
									{
										text: 'SACADO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('000000' + model['FINANCEIROS_ID_PESSOAS']).slice(-6),
										alignment: 'right',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]								
							},
							{   text: '|',  // Divisão entre canhoto e ficha
								alignment: 'center',
								border: [false, false, false, false]
							},							
							{
								colSpan: 3,	
								border: [false, false, false, false],
								table: {
									body: [
										[ 
											barcodes ? {
												image: 'data:image/png;base64,' + barcodes,
												width: 40,
												height: 40,
												alignment: 'center'														
											} : ''
										]
									]
								},
								layout: 'noBorders'
							},{},{},
							{
								text: [
									{
										text: 'AUTENTICACAO MECANICA\n\n',
										alignment: 'right',
										style: {fontSize: 7},
										border: [false, true, false, false]
									},
									{
										text: mesReferencia,
										alignment: 'right',
										style: {fontSize: 12, bold: true},
										border: [false, false, false, false]
									}
								],
								border:[false, false, false, false],
								colSpan: 3
							},{},{}
						]);

						impressos++;

						if(impressos > 2) {
							rows.push([  // linha de rodape fixa
								{
									text: '- '.repeat(120) + '\n\n',
									fontSize: 8,
									colSpan: 9,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{}
							]);	
							impressos = 0;
						} else {
							rows.push([  // linha de rodape fixa
								{
									text: '- '.repeat(120),
									fontSize: 8,
									colSpan: 9,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{}
							]);			
						}

					}
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const getQrcode = function(titulo) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('qrcode', titulo);
		const codqr = (codigo || '').toString("base64");
        resolve(codqr);
    });
};

const completeChars = function (str, chars, char = '0', direction = 'left') {
    var str = (str && str.toString) ? str.toString() : '',
        nCharsToComplete = chars - str.length;

    for (var i = 0; i < nCharsToComplete; i++) {
        if(direction == 'left'){
            str = char + str;
        } else if(direction == 'rigth'){
            str = str + char;
        } 
    }

    return str;
};