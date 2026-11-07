'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

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

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 25, 20, 25],
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
					margin: [20, 25, 20, 25]
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
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){

						mesReferencia = MesExtenso[(parseInt(res.results[i]['FINANCEIROS_VENCIMENTO'].substr(5, 2)) - 1)] + '/' +
										res.results[i]['FINANCEIROS_VENCIMENTO'].substr(0, 4)

						let pathLogo;

						try {
							pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
						} catch(error) {
							pathLogo = `${appRoot}/resources/images/headers/default.png`;
						}

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
										text: res.results[i]['EMPRESAS_FANTASIA'],
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
										text: res.results[i]['EMPRESAS_FANTASIA'],
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
										text: res.results[i]['PESSOAS_NOME'],
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
										text: res.results[i]['EMPRESAS_FANTASIA'],
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
										text: ('00' + res.results[i]['FINANCEIROS_PARCELA']).slice(-2) + '/' +
										      ('00' + res.results[i]['FINANCEIROS_PARCELAS']).slice(-2),
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
										text: ('00' + res.results[i]['FINANCEIROS_PARCELA']).slice(-2) + '/' +
										      ('00' + res.results[i]['FINANCEIROS_PARCELAS']).slice(-2),
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
										text: ('000000' + res.results[i]['FINANCEIROS_NUMERO']).slice(-6),
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
										text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ORIGINAL']),
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
										text: 'STILO MOVEIS - Rua Doutor José Foz, 636 - Centro', // Fixo por enquanto - observações ficha
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
										text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ORIGINAL']),
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
							{
								text: 'Presidente Prudente - SP Tel: (18) 3222-4926', // Fixo por enquanto - observacoes ficha
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
										text: res.results[i]['PESSOAS_NOME'] + ' (' + ('000000' + res.results[i]['FINANCEIROS_ID_PESSOAS']).slice(-6) + ')',
										alignment: 'left',
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
										text: ('000000' + res.results[i]['FINANCEIROS_NUMERO']).slice(-6),
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
										text: ('000000' + res.results[i]['FINANCEIROS_ID_PESSOAS']).slice(-6),
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
								text: 'AUTENTICACAO MECANICA',
								alignment: 'right',
								style: {fontSize: 7},
								colSpan: 6,
								border: [false, true, false, false]								
							},{},{},{},{},{}
						],
						[
							{
								text: [
									{
										text: 'EMBRANCO\n',
										alignment: 'left',
										style: {color: 'white'}
									}
								],
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'EMBRANCO\n',
										alignment: 'left',
										style: {color: 'white'}
									}
								],
								border: [false, false, false, false]
							},
							{   text: '|',  // Divisão entre canhoto e ficha
								alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: mesReferencia,
								alignment: 'right',
								style: {fontSize: 14, bold: true},
								colSpan: 6,
								border: [false, false, false, false]								
							},{},{},{},{},{}
						]);

						impressos++

						if(multiplo(impressos, 3) && impressos < res.results.length) {
							rows.push([
								{
									text: '_ '.repeat(80),
									border: [false, false, false, false],
									colSpan: 9,
									pageBreak: 'after'
								},{},{},{},{},{},{},{},{}
							]);
						} else {
							rows.push([
								{
									text: '_ '.repeat(80),
									border: [false, false, false, false],
									colSpan: 9,
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

function multiplo(valor, multiplo)
{
	let resto = valor % multiplo;
	if(resto == 0)
		return true;
	else
		return false;
}
