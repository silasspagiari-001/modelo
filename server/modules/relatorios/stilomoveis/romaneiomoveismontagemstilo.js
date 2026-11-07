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
				.then(async res => {
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

					const romaneio = res.results && res.results[0] ? res.results[0] : undefined;
                    const searchPedidos = await api.movimentos().readById(romaneio['ROMANEIOS_ITENS'].reduce((ids, pedido) => {
						ids += pedido['ROMANEIOSITENS_ID_MOVIMENTOS'] + ',';
                        return ids;
					}, '').slice(0, -1), params);

                    const pedidosFiltrados = (searchPedidos.results || []).filter(pedido => {
                        return pedido['ROMANEIOS_DOCUMENTO'] == 'Romaneio Montagem'
                    });

                    const pedidos = romaneio['ROMANEIOS_ITENS'].map(item => {
                        return pedidosFiltrados.find(pedido => {
                            return pedido['MOVIMENTOS_ID'] == item['ROMANEIOSITENS_ID_MOVIMENTOS'];
                        });
                    });

                    pedidos.forEach(pedido => {
						let model         = res.results[0];
                        let fantasia      = pedido['EMPRESAS_FANTASIA'];
						let produtos      = pedido['MOVIMENTOS_ITENS'];
						let obsRomaneio   = model['ROMANEIOS_OBSERVACOES'].split('|').join(' ');
						let itensPagina   = 0;					
						let rows = docDefinition.content[0].table.body;					

						rows.push(
							[
								{
									text: [
										{
											text: 'RM\n',
											fontSize: 16,
											bold: true
										},
										{
											text: 'ROMANEIO\n',
											fontSize: 14,
											bold: true
										},
										{
											text: 'DE MONTAGEM',
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
										{ text: 'a\n', color: 'white', fontSize: 4},
										{
											text: 'Romaneio: ' + ('000000' + model['ROMANEIOS_NUMERO'].toString()).slice(-6),
											alignment: 'left',
											style: {bold: true,	fontSize: 10}

										},
										{ text: '\na\n', color: 'white', fontSize: 4},
										{
											text: 'Data: ' + 
											moment(model['ROMANEIOS_EMISSAO']).format('DD/MM/YYYY'),
											style: {bold: true,	fontSize: 10},
											alignment: 'left'
										},
										{ text: '\na\n', color: 'white', fontSize: 4},
										{
											text: 'Vendedor: ' + pedido['MOVIMENTOS_ID_USUARIOS'] + ' - ' + pedido['USUARIOS_NOME'].substring(0, 30),
											style: {bold: true,	fontSize: 10},
											alignment: 'left'
										}										
									]
								},
								{},{},{},{},{},{
									colSpan: 2,
									text: [
										{   text: 'a\n', color: 'white', fontSize: 4}, 
										{
											text: fantasia.indexOf('-') != -1 ? fantasia.slice(fantasia.indexOf('-') + 2, Infinity) : fantasia.slice(0, 2),
											fontSize: 25,
											bold: true,
											alignment: 'center'
										},
										{   text: 'a\n', color: 'white', fontSize: 4},
										{
											text: utils.number.float2moeda(romaneio['ROMANEIOS_FRETE']),
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
											text: 'a\n',
											color: 'white',
											fontSize: 6
										},
										{
											text: 'PEDIDO\n',
											fontSize: 10, 
											bold: true,
											alignment: 'center'
										},
										{
											text: 'a\n',
											color: 'white',
											fontSize: 4
										},
										{
											text: ('000000' + pedido['MOVIMENTOS_NUMERO'].toString()).slice(-6),
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
									text: '(' + pedido['MOVIMENTOS_ID_PESSOAS'] + ') ' + pedido['MOVIMENTOS_NOME'], 
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
									text: utils.string.maskCep(pedido['PESSOAS_CEP']),
									colSpan: 2
								},
								{}                            
							], // 12 ok
							[
								{
									text: 'Endereço:'
								},
								{
									text: pedido['PESSOAS_ENDERECO'],
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
									text: pedido['PESSOAS_NUMERO'],
									alignment: 'right'
								},
								{
									text: 'Tel:'
								},
								{
									text: utils.string.maskFone(pedido['PESSOAS_TELEFONE']),
									colSpan: 2
								},
								{}                            
							],
							[
								{
									text: 'Bairro:'
								},
								{
									text: pedido['PESSOAS_BAIRRO'],
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
									text: utils.string.maskFone(pedido['PESSOAS_CELULAR']),
									colSpan: 2								
								}, 
								{}
							],
							[
								{
									text: 'Cidade:'
								},
								{
									text: pedido['CIDADES_NOME'] + '/' + pedido['CIDADES_ESTADO'],
									colSpan: 11
								},{},{},{},{},{},{},{},{},{},{},
							],
							[
								{
									text: 'Obs:'
								},
								{
									text: obsRomaneio,
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
									colSpan: 5							
								}, 
								{},{},{},{},
								{
									text: 'Cor',
									alignment: 'center',								
									colSpan: 4
								},{},{},{},
								{
									text: 'Qtde',
									alignment: 'center'								
								},
								{
									text: 'Obs',
									alignment: 'center',
								}
							]
						);

						for(let i in produtos){
                            if(produtos[i]['MONTAGENS_VALOR'] > 0 && produtos[i]['MOVIMENTOSITENS_CSTPIS'] != 'ML') {
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
											colSpan: 5,
											fontSize: 8,									
											style: {
												bold: true
											}
										},{},{},{},{},
										{
											text: produtos[i]['PRODUTOS_APLICACAO'],
											alignment: 'center',
											fontSize: 8,									
											style: {
												bold: true
											},										
											colSpan: 4
										},{},{},{},
										{
											text: produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
											alignment: 'right'								
										},
										{
											text: (produtos[i]['MOVIMENTOSITENS_ID_EMPRESAS'] == 1 ? 'L' : 'D'),
										}
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
									text: 'RECEBI(EMOS) OS PRODUTOS CONSTANTES DO ROMANEIO ACIMA, EM PERFEITAS CONDIÇÕES.',
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
									text: 'NOME COMPLETO DO RECEBEDOR E NÚMERO DO DOCUMENTO\n\n\n\n',
									fontSize: 7,
									alignment: 'left',
									colSpan: 10,
								},{},{},{},{},{},{},{},{},{}
							]
						);

					}); // fim do for each
					
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
