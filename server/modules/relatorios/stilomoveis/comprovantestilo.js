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
        return new Promise(async (resolve, reject) => {
			api.romaneiosmoveis().readById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 35],
						content: [
							{
								style: 'tableReport',
								table: {   //    52
									//        1   2   3   4   5   6   7   8   9  10  11  12
									widths: [46, 78, 55, 39, 15, 15, 26, 34, 35, 25, 38, 34],
									heights: 5,
									headerRows: 7,									
									body: []
								},
								style: {
									fontSize: 10
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
					let produtos      = model['ROMANEIOS_ITENS'];
					let itensPagina   = 0;					
					let rows = docDefinition.content[0].table.body;					

					rows.push(
						[
							{
								text: [
									{
										text: 'CE\n',
										fontSize: 16,
										bold: true
									},
									{
										text: 'COMPROVANTE\n',
										fontSize: 14,
										bold: true
									},
									{
										text: 'DE ENTREGA',
										fontSize: 14,
										bold: true
									}
								],
								colSpan: 2,
								width: 100,
								alignment: 'center'
							},
							{},
							{
								colSpan: 6,
								text: [
									{
										text: 'Transportador: (' + model['ROMANEIOS_ID_TRANSPORTES'] + ') ' + model['TRANSPORTES_NOME'] + '\n',										      
										alignment: 'left',
										style: {bold: true,	fontSize: 10}

									},
									{
										text: 'Romaneio: ' + ('000000' + model['ROMANEIOS_NUMERO'].toString()).slice(-6) + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 10}

									},
									{
										text: 'Data: ' + 
										moment(model['ROMANEIOS_EMISSAO']).format('DD/MM/YYYY') +
										'\nVendedor: ' + produtos[0]['MOVIMENTOS_ID_USUARIOS'] + ' - ' + produtos[0]['USUARIOS_NOME'],
										style: {bold: true,	fontSize: 10},
										alignment: 'left'
									}																
								]
							},
							{},{},{},{},{},{
								colSpan: 2,
								text: [
									{
										text: '1\n',
										fontSize: 26,
										alignment: 'center',
										bold: true
									},
									{
										text: utils.number.float2moeda(produtos[0]['MOVIMENTOS_TOTAL']),
										fontSize: 12,
										alignment: 'center',										
										bold: true
									}
								]
							},{},
							{ 
								colSpan: 2,									
								text: [
									{
										text: ''
									},
									{
										text: 'Pedido N.º\n\n',
										fontSize: 10, 
										alignment: 'center'
									},
									{
										text: ('000000' + produtos[0]['MOVIMENTOS_NUMERO'].toString()).slice(-6),
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 20
										}
									}
								]
							},{}
						],
						[
							{
								text: 'Nome:'
							},
							{
								text: produtos[0]['MOVIMENTOS_NOME'],
								colSpan: 8
							}, 
							{}, 
							{},							
							{}, 
							{},
							{}, 
							{}, 
							{},
							{
								text: 'CEP:'
							},
							{
								text: utils.string.maskCep(produtos[0]['PESSOAS_CEP']),
								colSpan: 2
							},
							{}                            
						], // 12 ok
						[
							{
								text: 'Endereço:'
							},
							{
								text: produtos[0]['PESSOAS_ENDERECO'],
								colSpan: 6
							},
							{},
							{},
							{},
							{},
							{},
							{
								text: 'Número:',
								alignment: 'right',
								style: {
									fontSize: 8
								}
							}, 
							{
								text: produtos[0]['PESSOAS_NUMERO'],
								alignment: 'right'
							},
							{
								text: 'Tel:'
							},
							{
								text: utils.string.maskFone(produtos[0]['PESSOAS_TELEFONE']),
								colSpan: 2
							},
							{}                            
						],
						[
							{
								text: 'Bairro:'
							},
							{
								text: produtos[0]['PESSOAS_BAIRRO'],
								colSpan: 8
							}, 
							{}, 
							{},
							{},
							{},
							{},
							{},
							{},							 
							{
								text: 'Cel:'
							}, 
							{
								text: utils.string.maskFone(produtos[0]['PESSOAS_CELULAR']),
								colSpan: 2								
							}, 
							{}
						],
						[
							{
								text: 'Cidade:'
							},
							{
								text: produtos[0]['CIDADES_NOME'] + '/' + produtos[0]['CIDADES_ESTADO'],
								colSpan: 11
							},{},{},{},{},{},{},{},{},{},{},
						],
						[
							{
								text: 'Obs.:'
							},
							{
								text: produtos[0]['PESSOAS_OBSERVACOES'] ? produtos[0]['PESSOAS_OBSERVACOES'] : '',
								colSpan: 11
							},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{ 
								text: '', 
								style: {
									bold: true,
									fontSize: 1
								},
								colSpan: 12,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								text: 'Código',
								alignment: 'center'
							},
							{
								text: 'Descrição do Produto',
								alignment: 'center',
								colSpan: 4							
							}, 
							{}, {}, {},
							{
								text: 'Cor',
								alignment: 'center',								
								colSpan: 3
							},{},{},
							{
								text: 'Qtde',
								alignment: 'center'								
							},
							{
								text: 'Obs',
								alignment: 'center',
								colSpan: 3								
							},{},{}
						]
					);

					for(let i in produtos){
						rows.push(
							[
								{							
									text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
									alignment: 'center',
									fontSize: 8,
									style: {
										bold: true
									}											
								},
								{
									text: produtos[i]['PRODUTOS_NOME'],
									colSpan: 4,
									fontSize: 8,									
									style: {
										bold: true
									}
								}, {}, {}, {},
								{
									text: produtos[i]['PRODUTOS_MARCA'],
									alignment: 'center',
									fontSize: 8,									
									style: {
										bold: true
									},										
									colSpan: 3
								},{},{},
								{
									text: produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
									alignment: 'right'								
								},
								{
									text: '',
									colSpan: 3
								},{},{}
							]
						)

						itensPagina++
						if(itensPagina > 25) {
							itensPagina = 0;
							rows.push( // Aqui fecho o rodapé de cada página
								[
									{
										colSpan: 12,
										text: 'Continua...',
										pageBreak: 'after',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{}
								]						
							);									
						}

					}  // end for

					rows.push(
						[
							{ 
								text: '\n', 
								style: {
									bold: true,
									fontSize: 6
								},
								colSpan: 12,
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{}
						],	
						[  
							{
								text: 'RECEBI(EMOS) OS PRODUTOS DO COMPROVANTE DE ENTREGA ACIMA, EM PERFEITAS CONDIÇÕES.',
								fontSize: 6,
								alignment: 'left',
								colSpan: 12,
							},{},{},{},{},{},{},{},{},{},{},{}
						],
						[  
							{
								text: 'DATA DO RECEBIMENTO\n\n\n',
								fontSize: 7,
								alignment: 'left',
								colSpan: 2,
							},{},
							{
								text: 'Identificação e Assinatura do recebedor\n\n\n\n',
								fontSize: 7,
								alignment: 'left',
								colSpan: 10,
							},{},{},{},{},{},{},{},{},{}
						],
						[
							{ 
								text: '\n', 
								style: {
									bold: true,
									fontSize: 6
								},
								colSpan: 12,
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{}
						],	
						[
							{ 
								text: '\n', 
								style: {
									bold: true,
									fontSize: 6
								},
								colSpan: 12,
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{}
						],	
					);
					
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
