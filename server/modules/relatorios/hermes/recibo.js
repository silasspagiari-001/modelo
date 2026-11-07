'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			background: [
				{
					image: `${appRoot}/resources/images/marcasdagua/recibo.png`,
					width: 600 // 792
				}
			],						
			pageMargins: [30, 30, 30, 30],
			content: [
				{columns: [{},{},{},{},{},{}]},
				{
					style: 'tableReport',
					table: {   // Recibo utilizará 6 colunas (width total 480)
						widths: [80, 80, 80, 80, 40, 120],
						body: []
					}
				} 
			],
			styles: {
				tableReport: {
					margin: [0, 0, 0, 0],
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.caixa().read(params)
				.then(res => {
					let rows   = docDefinition.content[1].table.body;
					let pagNome    = '',
					    pagTotal   = 0,
						pagTdc     = '',
						pagCpfcnpj = '',
						recNome    = '',
						recTdc     = '',
						recCpfcnpj = '';

//					for (let vias = 0; vias < 2; vias++) {

						for(let i in res.results){

							// Dados Pagador/Recebedor
							if(res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'E') {
								pagNome    = res.results[i]['PESSOAS_NOME'];
								pagCpfcnpj = res.results[i]['PESSOAS_CPFCNPJ'];
								recNome    = res.results[i]['EMPRESAS_NOME'];
								recCpfcnpj = res.results[i]['EMPRESAS_CPFCNPJ'];
							} else {
								pagNome    = res.results[i]['EMPRESAS_NOME'];
								pagCpfcnpj = res.results[i]['EMPRESAS_CPFCNPJ'];
								recNome    = res.results[i]['PESSOAS_NOME'];
								recCpfcnpj = res.results[i]['PESSOAS_CPFCNPJ'];
							}

							pagTotal = (res.results[i]['MOVIMENTOSCAIXA_TOTAL'] - res.results[i]['MOVIMENTOSCAIXA_DUPLICATA']);
							pagTdc   = (pagCpfcnpj.length == 11 ? 'CPF' : 'CNPJ');
							recTdc   = (recCpfcnpj.length == 11 ? 'CPF' : 'CNPJ');

							rows.push([
								{
									text: 'Referência',
									fontSize: 10,
									style: 'tableHeader',
									alignment: 'left'
								},
								{
									colSpan: 4,
									text: 'Recibo',
									fontSize: 20,
									style: 'tableHeader',
									alignment: 'center'
								},{},{},{},
								{
									text: [
										{
											text: 'Valor\n',
											fontSize: 10, 
											alignment: 'left'
										},
										{
											text: `R$ ${utils.number.float2moeda(pagTotal)}\n`,
											alignment: 'right',
											style: {
												bold: true,
												fontSize: 14
											}
										}
										
									]
								}								
							]);
							rows.push([
								{
									colSpan: 3,
									text: [
										{
											text: 'Pagador:\n',
											fontSize: 10, 
											alignment: 'left'
										},
										{
											text:  `${pagNome}\n`,
											alignment: 'left',
											style: {
												bold: true,
												fontSize: 12
											}
										},
										{
											text:  `${pagTdc}: ${utils.string.maskCnp(pagCpfcnpj)}\n`,
											alignment: 'left',
											style: {
												bold: true,
												fontSize: 12
											}
										}									
									]
								},{},{},
								{
									colSpan: 3,
									text: [
										{
											text: 'Recebedor:\n',
											fontSize: 10, 
											alignment: 'left'
										},
										{
											text: `${recNome}\n`,
											alignment: 'left',
											style: {
												bold: true,
												fontSize: 12
											}
										},
										{
											text:  `${recTdc}: ${utils.string.maskCnp(recCpfcnpj)}\n`,
											alignment: 'left',
											style: {
												bold: true,
												fontSize: 12
											}
										}
									]	
								},{},{}
							]);
							rows.push([
								{
									colSpan: 6,
									text:  `Recebi(emos) de ${pagNome}, ${pagTdc} nº ${utils.string.maskCnp(pagCpfcnpj)},
											a importância de R$ ${utils.number.float2moeda(pagTotal)} (${utils.number.ValorPorExtenso(pagTotal)}) referente a ${res.results[i]['MOVIMENTOSCAIXA_NOME']}
											
											
											
											`,
									alignment: 'justify',
									style: {
										bold: true,
										fontSize: 12
									}
								}
							]);
							rows.push([
								{
									colSpan: 3,
									text: [
										{
											text: 'Pago por:\n\n\n',
											fontSize: 10, 
											alignment: 'left'
										},
										{
											text:  '_______________________________________________________\n\n\n\n',
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 10
											}
										},
										{
											text:  'Assinatura:____________________________________________',
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 10
											}
										}									
									]
								},{},{},
								{
									colSpan: 3,
									text: [
										{
											text: 'Recebido por:\n\n\n',
											fontSize: 10, 
											alignment: 'left'
										},
										{
											text:  '_______________________________________________________\n\n\n\n',
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 10
											}
										},
										{
											text:  'Assinatura:____________________________________________',
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 10
											}
										}									
									]
								},{},{}
							]);

							rows.push([
								{
									text: `\n\n${res.results[i]['CIDADES_NOME']}, ${res.results[i]['CIDADES_ESTADO']}, __________ de ___________________ de ___________`,
									colSpan: 5,
									fontSize: 12, 
									alignment: 'left',
									border: [true, false, true, true]
								},{},{},{},{},
								{
									text: '\n', // (vias == 0 ? '\n1ª via - Pagador\n' : '\n2ª via - Recebedor\n'),
									fontSize: 10,
									alignment: 'center',
									border: [true, false, true, true]
								},
							]);

							rows.push([ //Linha em branco
								{
									text: ' ',
									colSpan: 5,
									border: [false, false, false, false]
								},{},{},{},{},
								{
									text: ' ',
									border: [false, false, false, false]
								}
							]);													

							rows.push([ //fechando a tabela e colocando uma linha em branco para recorte.
								{
									text: ' ',
									colSpan: 5,
									border: [false, true, false, false] // (vias == 0 ? [false, true, false, false] : [false, false, false, false]),
								},{},{},{},{},
								{
									text: ' ',
									border: [false, true, false, false] // (vias == 0 ? [false, true, false, false] : [false, false, false, false]),
								}
							]);													
							
							
						};
//					};

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	},
		
};
