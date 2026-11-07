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
			pageMargins: [40, 40, 40, 35],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Emp Num Par Emi Vct Ori Jur Dsc Abe Obs
						       // 1   2   3   4   5   6   7   8   9   10
						widths: [16, 36, 16, 55, 55, 60, 45, 45, 60, 52],
						headerRows: params.pessoa ? 7 : 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(95),
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
            delete params.limit;
			api.financeiros().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let ultimaEmpresa = 0;
					let empOriginal  = 0;
					let empJuros     = 0
                    let empDescontos = 0;
					let empAberto    = 0;

					let totalOriginal  = 0;
					let totalJuros     = 0
                    let totalDescontos = 0;
					let totalAberto    = 0;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
					
					rows.push(
                        [
                            {
								image: pathLogo,
                                width: 80,
                                colSpan: 4,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},{},
							{
								colSpan: 4,
								text: 'Relação de Titulos - ' + (params.tipo == 'R' ? 'Cliente' : 'Fornecedor'),
								alignment: 'center',
								style: {bold: true,	fontSize: 12},
								border: [false, false, false, false]
							},{},{},{},
                            {
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false],
                                colSpan: 2								
							},{}
						],
						[
                            {
								text: res.results[0]['EMPRESAS_FANTASIA'],
								colSpan: 4,
								alignment: 'left',
								style: {bold: true,	fontSize: 8},
								border: [false, false, false, false]																
							},{},{},{},
							{
								colSpan: 4,
								text: 'Vencimento: ' + params.inicio + ' a ' + params.final,
								alignment: 'center',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							},{},{},{},
                            {
								colSpan: 2,
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]								
							},{}
						]
					);

					if(params.pessoa) {  // se os titulos forem de pessoa individual
						rows.push(	          // Aqui irá os dados da pessoa num cabeçalho
							[
								{
									text: 'Nome:',
									colSpan: 2
								},{},							
								{
									text: res.results[0]['PESSOAS_NOME'] + '(' + res.results[0]['FINANCEIROS_ID_PESSOAS'] + ')',
									colSpan: 6
								},{},{},{},{},{},
								{
									text: 'Cep: ' + utils.string.maskCep(res.results[0]['PESSOAS_CEP']),
									colSpan: 2
								},{}
							], 
							[
								{
									text: 'Endereço:',
									colSpan: 2
								},{},
								{
									text: res.results[0]['PESSOAS_ENDERECO'] + (res.results[0]['PESSOAS_NUMERO'] ? ', ' + res.results[0]['PESSOAS_NUMERO']: ''),
									colSpan: 6
								},{},{},{},{},{},
								{
									text: 'Tel: ' + utils.string.maskFone(res.results[0]['PESSOAS_TELEFONE']),
									colSpan: 2
								},{},
							],
							[
								{
									text: 'Bairro:',
									colSpan: 2
								},{},
								{
									text: res.results[0]['PESSOAS_BAIRRO'],
									colSpan: 3
								}, 
								{},{},
								{
									text: 'Cel: ' + utils.string.maskFone(res.results[0]['PESSOAS_CELULAR']),
									colSpan: 3
								}, {} ,{},
								{
									text: (res.results[0]['PESSOAS_CPFCNPJ'].length == 11 ? 'Rg: ' : 'IE: ') + res.results[0]['PESSOAS_INSCRICAO'],
									colSpan: 2								
								},{}
							],
							[
								{
									text: 'Cidade:',
									colSpan: 2
								},{},
								{
									text: res.results[0]['CIDADES_NOME'] + '/' + res.results[0]['CIDADES_ESTADO'],
									colSpan: 6
								},{},{},{},{},{},
								{
									text: (res.results[0]['PESSOAS_CPFCNPJ'].length == 11 ? 'CPF:' : 'CNPJ:') +
									utils.string.maskCnp(res.results[0]['PESSOAS_CPFCNPJ']),
									colSpan: 2
								},{}
							],
							[
								{
									text: '',
									fontSize: 6,
									colSpan: 2,
									border: [false, false, false, false]
								},{},
								{
									text: '',
									fontSize: 6,
									colSpan: 6,
									border: [false, false, false, false]								
								},{},{},{},{},{},
								{
									text: '',
									fontSize: 6,
									colSpan: 2,
									border: [false, false, false, false]								
								},{}
							]
						);
                    };
                    
					rows.push(					
						[
							{
								text: 'Lj',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Número',
								style: 'tableHeader',
								alignment: 'center'									
							},							
							{
								text: 'Par',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Emissão',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Vencimento',
								style: 'tableHeader',
								alignment: 'center'									
							},                   
							{
								text: 'Original',
								style: 'tableHeader',
								alignment: 'center'									
							},                                             
							{
								text: 'Juros',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Desconto',
								style: 'tableHeader',
								alignment: 'center'
							},                     
							{
								text: 'Aberto',
								style: 'tableHeader',
								alignment: 'center'
							},                                           
							{
								text: 'Prazo',
								style: 'tableHeader',
								alignment: 'center'									
							}
						]					
                    );

					for(let i in res.results){

						if(res.results[i]['FINANCEIROS_ID_EMPRESAS'] !== ultimaEmpresa) {
							if(ultimaEmpresa > 0) {
								rows.push([
									{
										text: '',
										colSpan: 3,
										border: [false, false, false, false]							
									},{},{},
									{
										text: `Subtotal (${ultimaEmpresa})`,
										colSpan: 2,										
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'			
									},{},
									{
										text: utils.number.float2moeda(empOriginal / 100),
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: empJuros > 0 ? utils.number.float2moeda(empJuros / 100) : '',
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: empDescontos > 0 ? utils.number.float2moeda(empDescontos / 100) : '',
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: utils.number.float2moeda(empAberto / 100),
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: '',
										border: [false, false, false, false]
									}
								]);			
							}
							ultimaEmpresa = res.results[i]['FINANCEIROS_ID_EMPRESAS'];
							empOriginal   = 0;
							empAberto     = 0;
							empJuros      = 0;
							empDescontos  = 0;
						}

						rows.push([
							{
								text: res.results[i]['FINANCEIROS_ID_EMPRESAS'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['FINANCEIROS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
							},							
							{
								text: res.results[i]['FINANCEIROS_PARCELA'],
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: moment(res.results[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},                            
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ORIGINAL']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['FINANCEIROS_JUROS'] > 0 ? utils.number.float2moeda(res.results[i]['FINANCEIROS_JUROS']) : '',
								alignment: 'right',
								style: 'tableExample'
							},								
							{
								text: res.results[i]['FINANCEIROS_DESCONTOS'] > 0 ? utils.number.float2moeda(res.results[i]['FINANCEIROS_DESCONTOS']) : '',
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ABERTO']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['PRAZOCALCULADO_FINANCEIRO'],
								alignment: 'right',
								style: 'tableExample'
							}                            								
						]);

						empOriginal  += (res.results[i]['FINANCEIROS_ORIGINAL'] * 100);
						empAberto    += (res.results[i]['FINANCEIROS_ABERTO'] * 100);
						empJuros     += (res.results[i]['FINANCEIROS_JUROS'] * 100);
						empDescontos += (res.results[i]['FINANCEIROS_DESCONTOS'] * 100);

						totalOriginal  += (res.results[i]['FINANCEIROS_ORIGINAL'] * 100);
						totalAberto    += (res.results[i]['FINANCEIROS_ABERTO'] * 100);
						totalJuros     += (res.results[i]['FINANCEIROS_JUROS'] * 100);
						totalDescontos += (res.results[i]['FINANCEIROS_DESCONTOS'] * 100);

					}

					rows.push([
						{
							text: '',
							colSpan: 3,
							border: [false, false, false, false]							
						},{},{},
						{
							text: `Subtotal (${ultimaEmpresa})`,
							colSpan: 2,							
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},
						{
							text: utils.number.float2moeda(empOriginal / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: empJuros > 0 ? utils.number.float2moeda(empJuros / 100) : '',
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: empDescontos > 0 ? utils.number.float2moeda(empDescontos / 100) : '',
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(empAberto / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false]
						}
					]);			
		
					rows.push([
						{
							text: '',
							colSpan: 3,
							border: [false, false, false, false]							
						},{},{},
						{
							text: 'Total Geral',
							colSpan: 2,							
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},{},
						{
							text: utils.number.float2moeda(totalOriginal / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: totalJuros > 0 ? utils.number.float2moeda(totalJuros / 100) : '',
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: totalDescontos > 0 ? utils.number.float2moeda(totalDescontos / 100) : '',
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalAberto / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false]
						}
					]);
										
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
