'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

const codes = require('rescode');
codes.loadModules(['interleaved2of5'], {"includetext" : false});

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',                //   E   S   D   I
 			pageMargins: [15, 15, 15, 20], // [15, 15, 15, 15]
			content: [
				{
					style: 'tableReport',
					table: {   
						widths: [ 95, 95, 90, 90, 150],  // 5 Cols
						dontBreakRows: true,
						body: []
					},
					style: {
						fontSize: 8
					}
				}
			],
			styles: {
				tableReport: {
					margin: [0, 0, 0, 0]
				}
			}
		};

        return new Promise((resolve, reject) => {
			api.financeiros().readById(params.ids, params)
				.then(async res => {
					let rows = docDefinition.content[0].table.body;

					for(let i in res.results){

						let model           = res.results[i];
						let emiTitulo       = moment(model['FINANCEIROS_EMISSAO']    || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(model['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY');
						let vctTitulo       = moment(model['FINANCEIROS_VENCIMENTO'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(model['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY');
						let nomePessoa      = model['PESSOAS_NOME'];
						let numeroTitulo    = model['FINANCEIROS_NUMERO'];
						let serieTitulo     = model['FINANCEIROS_SERIE'];
                        let parcelaTitulo   = model['FINANCEIROS_PARCELA'] || 1;
                        let parcelasTitulo  = model['FINANCEIROS_PARCELAS'] || 1;
                        let valorExtenso    = utils.number.ValorPorExtenso(model['FINANCEIROS_ORIGINAL']);
                        const qtdAsteriscos = 140 - valorExtenso.length;
												
						rows.push([
							{
                                text: 'Fornecedor: ',
                                fontSize: 12,
								border: [true, true, false, false]
							},
                            {
                                text: ('000000' + model['FINANCEIROS_ID_PESSOAS']).slice(-6) + ' ' + nomePessoa,
								fontSize: 12,
                                colSpan: 3,
								border: [false, true, false, false]
                            },{},{},
                            {
                                text: 'Valor: ' + utils.number.float2moeda(model['FINANCEIROS_ORIGINAL']),
                                alignment: 'right',
                                fontSize: 12,
                                bold: true,
								border: [false, true, true, false]
                            }
						]);

						rows.push([
							{
                                text: 'Nota Fiscal: ',
                                fontSize: 12,
								border: [true, false, false, false]
							},
                            {
                                text: ('000000' + numeroTitulo).slice(-6) + ' ' + serieTitulo,
								border: [false, false, false, false],
                                fontSize: 12
                            },
                            {
                                text: 'Emissão: ' + emiTitulo,
                                alignment: 'center',
								border: [false, false, false, false],
                                fontSize: 12,
                                colSpan: 2
                            },{},
                            {
                                text: 'Vencimento: ' + vctTitulo,
                                alignment: 'right',
								border: [false, false, true, false],
                                fontSize: 12,
                            }
						]);

						rows.push([
							{
                                text: 'Valor da Nota: ',
                                fontSize: 12,
								border: [true, false, false, false]
							},
                            {
                                text: utils.number.float2moeda(model['FINANCEIROS_TOTAL'] || model['FINANCEIROS_ORIGINAL']),
                                fontSize: 12,
                                colSpan: 4,
								border: [false, false, true, false]
                            },{},{},{}                            
						]);

						rows.push([
							{
                                text: 'Nro. Duplicata: ',
								border: [true, false, false, false],
                                fontSize: 12,
							},
                            {
                                text: ('000000' + numeroTitulo).slice(-6) + ' ' + serieTitulo + ' ' + parcelaTitulo + '/' + parcelasTitulo,
                                fontSize: 12,
                                colSpan: 4,
								border: [false, false, true, false]
                            },{},{},{}                            
						]);

						rows.push([
							{
                                text: 'VALOR\nPOR\nEXTENSO',
                                alignment: 'center',
                                fontSize: 12,
							},
                            {
                                text: valorExtenso +  ' ' + '*-'.repeat(qtdAsteriscos),
								alignment: 'justify',
								fontSize: 12,
                                colSpan: 4
                            },{},{},{}                            
						]);

						rows.push([
							{
                                text: 'Observações:',
                                alignment: 'center',
								colSpan: 3,
                                fontSize: 12,
								border: [true, true, false, false]
							},{},{},
                            {
                                text: 'A U T O R I Z A Ç Ã O',
								alignment: 'center',
								fontSize: 12,
                                colSpan: 2,
								border: [false, true, true, false]
                            },{}
						]);

						rows.push([
							{
                                text: '\n' + '_'.repeat(54) + '\n',
								colSpan: 3,
                                fontSize: 12,
								border: [true, false, false, false]
							},{},{},
                            {
                                text: '\nData: ___________/____________/_______________',
								fontSize: 12,
                                colSpan: 2,
								border: [false, false, true, false]
                            },{}
						]);

						rows.push([
							{
                                text: '\n' + '_'.repeat(54) + '\n',
								colSpan: 3,
                                fontSize: 12,
								border: [true, false, false, false]
							},{},{},
                            {
                                text: '\nPor: _________________________________________',
								fontSize: 12,
                                colSpan: 2,
								border: [false, false, true, false]
                            },{}
						]);

						rows.push([
							{
                                text: '\n' + '_'.repeat(102) + '\n',
                                alignment: 'center',
								colSpan: 5,
                                fontSize: 12,
								border: [true, false, true, false]
							},{},{},{},{}
						]);

						rows.push([
							{
                                text: '\n' + '_'.repeat(102) + '\n',
                                alignment: 'center',
								colSpan: 5,
                                fontSize: 12,
								border: [true, false, true, false]
							},{},{},{},{}
						]);


						rows.push([
							{
                                text: '\n' + '_'.repeat(102) + '\n',
                                alignment: 'center',
								colSpan: 5,
                                fontSize: 12,
								border: [true, false, true, false]
							},{},{},{},{}
						]);


						rows.push([
							{
                                text: '\n' + '_'.repeat(102) + '\n',
                                alignment: 'center',
								colSpan: 5,
                                fontSize: 12,
								border: [true, false, true, true]
							},{},{},{},{}
						]);

						if(i < (res.results.length - 1)) {
							rows.push([
								{
									text: '',
									colSpan: 4,
									fontSize: 12,
									border: [false, false, false, false]
								},{},{},{},
								{
									text: '',
									fontSize: 12,
									pageBreak: 'after',
									border: [false, false, false, false]
								}
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
