'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

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
                        return pedido['ROMANEIOS_DOCUMENTO'] == 'Romaneio Entrega'
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
						let obsRomaneio   = model['ROMANEIOS_OBSERVACOES'].split('|').join(' ').trim();
						let obsPedido     = pedido['MOVIMENTOS_OBSERVACOES'].split('|').join(' ').trim() || '';
						const isRetirado  = obsRomaneio.match(/CLIENTE RETIROU/);
						const isOrcamento = obsRomaneio.match(/ENTREGUE POR ORÇAMENTO/);
						let obsImpressao  = obsPedido.length > 0 ?  
						                    `${obsPedido}\n${obsRomaneio.replace('CLIENTE RETIROU', '').replace('ENTREGUE POR ORÇAMENTO', '')}` :
											`${obsRomaneio.replace('CLIENTE RETIROU', '').replace('ENTREGUE POR ORÇAMENTO', '')}`; 
						let itensPagina   = 0;					
						let rows = docDefinition.content[0].table.body;	
						let algumComRomaneio = produtos.some(record => cents(record['MOVIMENTOSITENS_IMEDIATA']) > 0);
						let todosComVolumes = produtos.every(record => cents(record['PRODUTOS_MARCA']) > 0);
						let totalVolumes = 0;

						params.userId <= 1

						if(todosComVolumes) {
							for(let j in produtos){
								totalVolumes += ((cents(produtos[j]['MOVIMENTOSITENS_QUANTIDADE']) * cents(produtos[j]['PRODUTOS_MARCA'])) / 10000);
							};	
						}

						rows.push(
							[
								{
									text: [
										{
											text: 'RE\n',
											fontSize: 16,
											bold: true
										},
										{
											text: 'ROMANEIO\n',
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
											text: '\nRomaneio: ' + ('000000' + model['ROMANEIOS_NUMERO'].toString()).slice(-6) + '\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 10}

										},
										{
											text: 'Data: ' + 
											moment(model['ROMANEIOS_EMISSAO']).format('DD/MM/YYYY') + '\n' + 
											'Vendedor: ' + pedido['MOVIMENTOS_ID_USUARIOS'] + ' - ' + pedido['USUARIOS_NOME'].substring(0, 30),
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
											text: utils.number.float2moeda(pedido['MOVIMENTOS_TOTAL']),
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
											text: 'PEDIDO\n\n',
											fontSize: 10, 
											alignment: 'center'
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
								},{},{},{},{},{}, 
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
								},{}                            
							],
							[
								{
									text: 'Bairro:'
								},
								{
									text: pedido['PESSOAS_BAIRRO'],
									colSpan: 8
								},{},{},{},{},{},{},{},							 
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
									text: obsImpressao,
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

							if(algumComRomaneio && params.userId <= 2) {  // Supervisor e Ricardo
								if(cents(produtos[i]['MOVIMENTOSITENS_IMEDIATA']) == 0) {
									continue; // filtra os que não forem entregar no momento.
								}
							}

							const idProduto = produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'];
							const idGrupo = produtos[i]['PRODUTOS_ID_GRUPOS'];

							if(idGrupo == 999 || idProduto == 12187) { // Códigos para montadora e financeira
								continue;
							}
							rows.push(
								[
									{							
										text: idProduto,
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
										text: (algumComRomaneio && params.userId <= 2) ? produtos[i]['MOVIMENTOSITENS_IMEDIATA'].toFixed(0) : produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
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
									text: [
										{
											text: 'DATA DO RECEBIMENTO\n\n',
											fontSize: 7,
											alignment: 'left',		
										},
									    {
											text: model['ROMANEIOS_STATUS'] == 'R' ? 
											[{
												text: moment(model['ROMANEIOS_EMISSAO']).format('DD/MM/YYYY'),
												font: 'Consolas',
												fontSize: 14,
												alignment: 'center'
											}] :
											[{
												text: [
													{ text: 'AAA', color: 'white', fontSize: 18 },
													{ text: '/', fontSize: 18 },
													{ text: 'AAA', color: 'white', fontSize: 18 },											
													{ text: '/', fontSize: 18 }
												]
											}]
										}
									],
									colSpan: 2
								},{},
								{
									text: [
										{
											text: 'NOME COMPLETO DO RECEBEDOR E NÚMERO DO DOCUMENTO\n\n',
											fontSize: 7,
											alignment: 'left',
										},
										{
											text: `${isOrcamento ? 'ENTREGUE POR ORÇAMENTO' : isRetirado ? 'CLIENTE RETIROU' : '\n'}`,
											font: 'Consolas',
											fontSize: 14,
											alignment: 'left'
										}
									],				
									colSpan: 10,
								},{},{},{},{},{},{},{},{},{}
							]
						);

						if(todosComVolumes) {  // Se todos tem volume então imprime
							rows.push( 
								[
									{ 
										text: '\n', 
										style: { fontSize: 18 },
										colSpan: 12,
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{}
								],		
								[
									{ 
										text: '\n', 
										style: { fontSize: 4 },
										colSpan: 10,
										border: [true, true, true, false]
									}, 
									{},{},{},{},{},{},{},{},{},
									{
										text: '',
										colSpan: 2,
										border: [true, true, true, false]
									},{}
								],								
								[
									{
										colSpan: 10,
										text: 'TOTAL DE VOLUMES',
										alignment: 'center',
										fontSize: 20,
										border: [true, false, true, false]
									},{},{},{},{},{},{},{},{},{},
									{
										colSpan: 2,
										text: totalVolumes,
										fontSize: 28,
										bold: true,
										alignment: 'center',
										border: [true, false, true, false]										
									},{}
								],
								[
									{ 
										text: '\n', 
										style: { fontSize: 4 },
										colSpan: 10,
										border: [true, false, true, true]
									}, 
									{},{},{},{},{},{},{},{},{},
									{
										text: '', 
										style: { fontSize: 10 },
										colSpan: 2,
										border: [true, false, true, true]
									},{}
								]
							);
						} 
	
					}); // fim do for each

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
