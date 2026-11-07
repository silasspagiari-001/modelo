'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {			
			api.ordensproducao().readById(params.id, params)
				.then(async res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 35],
						header: function(page, pages) { 
							return {
								columns: [
									{
										text: ' Página: ' + page.toString() + ' de ' + pages.toString(),
										width: '*',
										style: {
											fontSize: 8,
											alignment: 'right'
										}
									}
								],
								margin: [25, 10]
							}
						},
						styles: {
							tableExample: {
								fontSize: 6,
								margin: [0, 0, 0, 0],
								border: 0
							},
							tableHeader: {
								bold: true,
								fontSize: 6,
								color: 'black'
							}
						},									
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
									widths: [34, 43, 19, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
									heights: 5,
									headerRows: 6,
									body: []
								},
								style: {
									fontSize: 8
								}
							}
						],
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
								
					let model = res.results[0];

					const dtIncOrdem   = moment(model['PRODUCOES_INCLUSAO']).format('DD/MM/YYYY');
					const dtIniOrdem   = moment(model['PRODUCOES_INICIO']).format('DD/MM/YYYY');
					const dtFinOrdem   = moment(model['PRODUCOES_FINALIZADA']).format('DD/MM/YYYY');
					const hrIncOrdem   = model['PRODUCOES_HORAINCLUSAO'];
					const hrIniOrdem   = model['PRODUCOES_HORAINICIO'];
					const hrFinordem   = model['PRODUCOES_HORAFINALIZADA'];
					let produtos        = model['PRODUCOES_ITENS'];			
					let itensPagina     = 0;
					let rows            = docDefinition.content[0].table.body;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/pedido/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/pedido/default.png`;
					}

					rows.push(
						[
							{
								image: pathLogo,
								colSpan: 2,
								width: 80,
								alignment: 'left',
								border: [true, true, false, true]
							},{},
							{
								colSpan: 10,
								table: {
									widths: ['*', '*', '*'],									
									body: [
										[
											{
												text: `A`,  // Pra alinhamento vertical
												color: 'white',
												colSpan: 3,
												style: {fontSize: 8}
											},{},{}
										],
										[
											{
												text: `ORDEM DE PRODUÇÃO`,
												alignment: 'center',
												colSpan: 3,
												style: {bold: true,	fontSize: 12}
											},{},{}
										],
										[ 
											{
												text: ``,
												alignment: 'left',
												style: {fontSize: 7}
											},
											{
												text: `Usuário:\n${params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`,
												alignment: 'right',
												colSpan: 2,
												style: {fontSize: 7}												
											},
											{}
										]
									]
								},
								layout: 'noBorders'
							},
							{},{},{},{},{},{},{},{},{},
							{ 
								colSpan: 2,									
								text: [
									{
										text: ''
									},
									{
										text: `Nº `,
										fontSize: 10, //16
										alignment: 'center'
									},
									{
										text: model['PRODUCOES_NUMERO'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 10 //16
										}
									},
									{
										text: `\nInclusão\n${dtIncOrdem}\n${hrIncOrdem}`,
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 10
										}										
									}									
								]
							},{}
						],
						[
							{
								text: 'Nome'
							},
							{
								text: model['PESSOAS_NOME'] + '(' + model['PRODUCOES_ID_PESSOAS'] + ')',
								style: {bold: true},
								colSpan: 7
							},{},{},{},{},{},{},
							{
								text: 'Início'
							}, 
							{
								text: dtIniOrdem,
								style: {bold: true},								
								colSpan: 2								
							},{}, 
							{
								text: 'Hora:'
							},
							{
								text: hrIniOrdem,
								colSpan: 2
							},
							{}                            
						], // 14 ok
						[
							{
								text: 'Endereço'
							},
							{
								text: model['PESSOAS_ENDERECO'],
								style: {bold: true},								
								colSpan: 7
							},{},{},{},{},{},{},
							{
								text: 'Finaliz'
							}, 
							{
								text: dtFinOrdem,
								colSpan: 2								
							},{},						
							{
								text: 'Hora'
							},
							{
								text: hrFinordem,
								style: {bold: true},								
								colSpan: 2
							},
							{}                            
						],
						[
							{ 
								text: '\n', 
								style: {
									fontSize: 1
								},
								colSpan: 14,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{}
						]);


						

					rows.push([ // 14 cols
						{
							text: 'Código',
							alignment: 'center'
						},
						{
							text: 'Descrição do Produto',
							alignment: 'center',
							colSpan: 8
						},{},{},{},{},{},{},{},
						{	
							text: 'Qtde',
							alignment: 'center',
							fontSize: 6
						},
						{	
							text: 'Preço',
							alignment: 'center',
							colSpan: 2,
							fontSize: 6
						},{},
						{	
							text: 'Total',
							alignment: 'center',
							colSpan: 2,
							fontSize: 6
						},{}
					]);

					for(let i in produtos){

						rows.push([
							{
								text: produtos[i]['PRODUCOESITENS_ID_PRODUTOS'],
								alignment: 'center',
								style: {fontSize: 8, bold: true}
							},
							{
								text: produtos[i]['PRODUTOS_NOME'],
								colSpan: 8,
								style: { fontSize: 8, bold: true }
							},{},{},{},{},{},{},{},
							{					
								text: produtos[i]['PRODUCOESITENS_QUANTIDADE'],
								alignment: 'right',
								style: { fontSize: 8, bold: true }
							},
							{
								colSpan: 2,
								text: utils.number.float2moeda(produtos[i]['PRODUCOESITENS_CUSTO']),
								alignment: 'right',
								style: { fontSize: 8, bold: true },
							},{},								
							{
								colSpan: 2,
								text: utils.number.float2moeda(produtos[i]['VALOR_TOTAL']),
								alignment: 'right',
								style: { fontSize: 8, bold: true },
							},{}							
						]);

						itensPagina++
						if(itensPagina > 39) {
							itensPagina = 0;
							rows.push( // Aqui fecho o rodapé de cada página
								[
									{
										colSpan: 14,
										text: 'Continua...',
										pageBreak: 'after',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]						
							);									
						}
					}  // end for

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const carregarPagamentos = function(model) {
	let formas     = '';
	let financeiros = model['PRODUCOES_FINANCEIROS'] || [];
	let titulos     = financeiros.filter(titulo => {
		return titulo['FINANCEIROS_ID_PESSOAS'] == model['PRODUCOES_ID_PESSOAS'];
	});
	let cheques     = model['PRODUCOES_CHEQUES'];
	let caixa       = model['PRODUCOES_CAIXA'];
	let isDevolucao = model['DOCUMENTOS_NOME'].toUpperCase().match(/DEVOLU/) ? true : false;

    if(model['PRODUCOES_NUMEROORIGEM']) {
		formas += 'Ref: ' + model['PRODUCOES_NUMEROORIGEM'] + ' ' + model['PRODUCOES_SERIEORIGEM'] + ' ';
	}

	if(isDevolucao) {
		if(model['PRODUCOES_SITUACAO'] === '0') {
			formas += ' (Abatimento no financeiro) ';
		} else {
			if(model['PRODUCOES_SITUACAO'] === '1') {
				formas += ' (Gerado crédito para cliente) ';
			} else {
				formas += ' (Retirada valor do caixa) ';
			}
		}
	}
	

	for (let i in caixa) {
		if(caixa[i]['PRODUCOESCAIXA_CREDITOPESSOA'] > 0 && !isDevolucao) {
			formas += 'Abatimento no Crédito Cliente: R$ ' + utils.number.float2moeda(caixa[i]['PRODUCOESCAIXA_CREDITOPESSOA']) + ' ';
		}		
		if(caixa[i]['PRODUCOESCAIXA_DINHEIRO'] > 0) {
			formas += 'Dinheiro: R$ ' + utils.number.float2moeda(caixa[i]['PRODUCOESCAIXA_DINHEIRO']) + ' ';
		}
		if(caixa[i]['PRODUCOESCAIXA_CREDITO'] > 0) {
			formas += 'Cartão Crédito: ' + utils.number.float2moeda(caixa[i]['PRODUCOESCAIXA_CREDITO']) + ' ';
		}
		if(caixa[i]['PRODUCOESCAIXA_DEBITO'] > 0) {
			formas += 'Cartão Débito: ' + utils.number.float2moeda(caixa[i]['PRODUCOESCAIXA_DEBITO']) + ' ';
		}		
	}

	if (cheques.length > 0) {
		formas += 'Cheque(s): '
		for (let i in cheques) {
			formas += 'Vcto: ' + moment(cheques[i]['CHEQUES_VENCIMENTO']).format('DD/MM/YYYY') + ' ';
			formas += ' R$ ' + utils.number.float2moeda(cheques[i]['CHEQUES_VALOR']) + ' ';
		}
		formas += '\n'
	}

	if (titulos.length > 0) {
		formas += 'Vencimentos: \n'
		for (let i in titulos) {
			formas += `${(parseInt(i)+1)}/${titulos.length} - ` +  moment(titulos[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY');
			formas += ' ' + utils.number.float2moeda(titulos[i]['FINANCEIROS_ORIGINAL']) + '  ';
			formas += (((parseInt(i)+1) % 3) == 0 ? '\n' : '');
		}	
	}

	return formas;
};