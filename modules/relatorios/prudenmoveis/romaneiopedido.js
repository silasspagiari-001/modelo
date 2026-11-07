'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const samosFB   = require('../../../services/samosFirebird');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(async res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 30, 20, 25], //  [20, 20, 20, 35]
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
									widths: [34, 43, 19, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
									heights: 5,
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

					let fanFilial = model['EMPRESAS_FANTASIA'];
					let siglaFilial = fanFilial.indexOf('-') != -1 ? fanFilial.slice(fanFilial.indexOf('-') + 2, Infinity) : fanFilial.slice(0, 2);

					let produtos        = model['MOVIMENTOS_ITENS'].sort((a, b) => {
						if (a['TOTAL_LIQUIDO'] < b['TOTAL_LIQUIDO']) {
							return 1;
						  }
						  if (a['TOTAL_LIQUIDO'] > b['TOTAL_LIQUIDO']) {
							return -1;
						  }
						  return 0;
					});
		
					let rows = docDefinition.content[0].table.body;
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
					

					if((model['ROMANEIOS_MOVEIS'] || []).length > 0) {
						if((model['ROMANEIOS_MOVEIS'][0]['ROMANEIOS_STATUS'] || '') == 'R') {  // Imprime se o cliente retirou

							let fantasia = model['EMPRESAS_FANTASIA'] || '';
	
							rows.push([
								{
									text: 'ROMANEIO\n',
									fontSize: 18, 
									border: [false, false, false, false],
									bold: true,
									colSpan: 14,
									color: 'red',
									alignment: 'center'
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]);   
						
							rows.push([
								{
									text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY') + '   N° ' + model['ROMANEIOS_MOVEIS'][0]['ROMANEIOS_NUMERO'],
									fontSize: 10,								
									border: [false, false, false, false],
									italics: true,
									colSpan: 9
								},{},{},{},{},{},{},{},{},
								{
									text: 'CLIENTE RETIROU',
									fontSize: 10,
									border: [false, false, false, false],
									alignment: 'right',
									colSpan: 5
								},{},{},{},{}
							]);
																
							rows.push([
								{
									text: [
										{
											text: 'SOLICITAÇÃO\n DE ENTREGA',
											fontSize: 12
										}
									],
									color: 'darkblue',
									bold: true,
									alignment: 'center',
									colSpan: 3,
									border: [true, true, true, true],
								},{},{},
								{
									text: 'a',
									color: 'white',
									colSpan: 4,
									border: [false, true, false, true]
								},{},{},{},
								{
									text: fantasia.indexOf('-') != -1 ? fantasia.split('-')[1] : '',
									alignment: 'center',
									fontSize: 25,
									bold: true,
									colSpan: 3,
									border: [true, true, true, true]
								},{},{},
								{
									text: [
										{
											text: 'Ordem do Serviço\n',
											fontSize: 9
										},
										{
											text: model['MOVIMENTOS_NUMERO'],
											fontSize: 15
										}
									],
									bold: true,
									alignment: 'center',
									colSpan: 4,
									border: [true, true, true, true]
								},{},{},{}
							]);
	
							rows.push([
								{
									text: 'Nome',
									fontSize: 9,
									border: [true, true, true, true]
								},
								{
									text: `${model['MOVIMENTOS_NOME']} ${model['PESSOAS_FANTASIA'].length > 0 ? ` (${model['PESSOAS_FANTASIA']})`: ''}(${model['MOVIMENTOS_ID_PESSOAS']})`,
									fontSize: 11,
									colSpan: 8,
									border: [true, true, true, true]
								},{},{},{},{},{},{},{},
								{
									text: 'Celular',
									fontSize: 9,          
									border: [true, true, true, true]
								},
								{
									text: utils.string.maskFone(model['MOVIMENTOS_CELULAR']),
									fontSize: 11,
									colSpan: 4,
									border: [true, true, true, true]
								},{},{},{}
							]);
							   
	
							rows.push([
								{
									text: 'Endereço',
									fontSize: 8,                                
									border: [true, true, true, true]
								},
								{
									text: model['PESSOAS_ENDERECO'] + ', ' + model['PESSOAS_NUMERO'],
									fontSize: 11,
									colSpan: 8,
									border: [true, true, true, true]
								},{},{},{},{},{},{},{},
								{
									text: 'Fone',
									fontSize: 9,                                
									border: [true, true, true, true]
								},
								{
									text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
									fontSize: 11,
									colSpan: 4,
									border: [true, true, true, true]
								},{},{},{}
							]);
		
							rows.push([
								{
									text: 'Bairro',
									fontSize: 9,                                
									border: [true, true, true, true]
								},
								{
									text: model['PESSOAS_BAIRRO'],
									fontSize: 11,
									colSpan: 6,
									border: [true, true, true, true]
								},{},{},{},{},{},
								{
									text: 'Cidade', 								
									fontSize: 9,                                                               
									border: [true, true, true, true]
								},
								{
									text: `${model['CIDADES_NOME']}/${model['CIDADES_ESTADO']}`,
									fontSize: 11,
									colSpan: 6,
									border: [true, true, true, true]
								},{},{},{},{},{},
							]);
							
							rows.push([
								{
									text: 'Obs',
									fontSize: 9,                                
									border: [true, true, true, true]
								},{
									text: model['PESSOAS_PAGINA'],
									fontSize: 11,
									colSpan: 13,
									border: [true, true, true, true],
								},{},{},{},{},{},{},{},{},{},{},{},{}
							]);
		
							rows.push([
								{
									text: 'Código',
									fontSize: 9,
									border: [true, true, true, true],
									alignment: 'center'
								},
								{
									text: 'Descrição do Produto',
									fontSize: 9,								
									colSpan: 8,
									border: [true, true, true, true],
									alignment: 'center'
								},{},{},{},{},{},{},{},
								{
									text: 'Cor',
									fontSize: 9,								
									border: [true, true, true, true],
									alignment: 'center',
									colSpan: 3
								},{},{},
								{
									text: 'Qtde',
									fontSize: 9,
									colSpan: 2,
									border: [true, true, true, true],
									alignment: 'center'
								},{}
							]);
	   
							produtos.forEach(item => {
	
								rows.push([
									{
										text: item['MOVIMENTOSITENS_ID_PRODUTOS'],
										border: [true, true, true, true],
										alignment: 'center'
									},
									{
										text: (item['PRODUTOS_NOME'] || '').substr(0, 50),
										fontSize: 10,
										colSpan: 8,
										border: [true, true, true, true]
									},{},{},{},{},{},{},{},
									{
										text: item['PRODUTOS_MARCA'],
										fontSize: 10,                                    
										border: [true, true, true, true],
										colSpan: 3,
										alignment: 'center'
									},{},{},
									{
										text: item['MOVIMENTOSITENS_QUANTIDADE'],
										colSpan: 2,
										fontSize: 10,                                    
										border: [true, true, true, true],
										alignment: 'center'
									},{}
								]);
							});
		
							rows.push([
								{
									text: 'ESTOU CIENTE QUE ESPELHOS, VIDROS E PEDRAS, DEVEM SER CONFERIDOS NESTE ATO, POR SEREM ITENS FRÁGEIS AO MANUSEIO\nRECEBI E CONFERI OS PRODUTOS CONSTANTES DA SOLICITAÇÃO DE ENTREGA ACIMA, ESTANDO TODOS EM PERFEITAS CONDIÇÕES.',
									border: [true, true, true, true],
									alignment: 'justify',
									fontSize: 9,
									colSpan: 14
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]);
							
							rows.push([
								{
									text: 'DATA DO RECEBIMENTO\n\n\n',
									border: [true, true, true, true],
									fontSize: 9,
									colSpan: 3
								},{},{},
								{
									text: 'IDENTIFICAÇÃO\n\n\n',
									border: [true, true, true, true],
									fontSize: 9,
									colSpan: 3
								},{},{},
								{
									text: 'ASSINATURA DO RECEBEDOR POR EXTENSO\n\n\n',
									border: [true, true, true, true],
									fontSize: 9,
									colSpan: 8
								},{},{},{},{},{},{},{}
							]);
						} // fim da impressão do romaneio
	
					}
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};