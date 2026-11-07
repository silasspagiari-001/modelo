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
			api.romaneiosconstrucao().readById(params.id, params)
				.then(res => {
					const impLog      = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
					let model         = res.results[0];
					let produtos      = model['ROMANEIOS_ITENS'];
					let obsPedido     = model['ROMANEIOS_OBSERVACOES'].split('|').join(' ');
					let itensPagina   = 0;
					let isReimpressao = model['ROMANEIOS_CONTADOR'] > 0 

					let docDefinition = {
						pageOrientation: 'portrait',
						pageSize: 'A4',
						background: [
							isReimpressao ?
							{  
								svg: `<svg><text
											transform="translate(50, 400) rotate(-50)"
											font-weight="bold"
											fill= "gray"
											style="font-size: 35px;"
										>
											Reimpressão
										</text></svg>`
							} : null
						],									
						pageMargins: [20, 20, 20, 35], // E,S,D,I 
						header: function(page, pages) { 
							return {
								columns: [
									{
										text: 'Comprovante No: ' + model['ROMANEIOS_NUMERO'],
										width: '*',
										style: {
											fontSize: 8,
											alignment: 'left'
										}
									},
									{
										text: 'Página: ' + page.toString() + ' de ' + pages.toString(),
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
								table: {
									//        1   2   3   4   5   6   7   8   9  10  11  12
									widths: [46, 82, 55, 39, 15, 15, 26, 34, 35, 25, 38, 34],
									body: []
								},
								style: {
									fontSize: 10
								}
							}
						]
					};								

					let rows = docDefinition.content[0].table.body;		

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}			

					rows.push([ // Cabeçalho						
							{
								image: pathLogo, 
								colSpan: 2,
								width: 100,
								alignment: 'left'
							},{},
							{
								colSpan: 10,
								text: [
									{
										text: 'Comprovante de Retirada/Entrega de Produtos\n',
										fontSize: 14, 
										alignment: 'center'		
									},
									{
										text: model['EMPRESAS_NOME'] + '\n',
										fontSize: 10,
										alignment: 'center'
									},
									{
										text: 'Vendedor: \n' + model['USUARIOS_NOME'],
										fontSize: 10,
										alignment: 'left'
									}
									
								]
							},{},{},{},{},{},{},{},{},{}
					]);

					rows.push([						
							{
								text: 'Cliente:',
								border: [true, true, true, true]
							},
							{
								text: '(' + model['MOVIMENTOS_ID_PESSOAS'] + ') ' + model['MOVIMENTOS_NOME'],
								colSpan: 8,
								border: [true, true, true, true]
							},{},{},{},{},{},{},{},
							{
								text: 'CEP:',
								border: [true, true, true, true]
							},
							{
								text: utils.string.maskCep(model['PESSOAS_CEP']),
								colSpan: 2,
								border: [true, true, true, true]
							},{}                            
						],
						[
							{
								text: 'Endereço:'
							},
							{
								text: model['PESSOAS_ENDERECO'] + (model['PESSOAS_NUMERO'] ? ', ' + model['PESSOAS_NUMERO']: ''),
								colSpan: 8
							},{},{},{},{},{},{},{},
							{
								text: 'Tel:'
							},
							{
								text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
								colSpan: 2
							},{}                            
						],
						[
							{
								text: 'Bairro:'
							},
							{
								text: model['PESSOAS_BAIRRO'],
								colSpan: 5
							},{},{},{},{},
							{
								text: 'Cel:'
							}, 
							{
								text: utils.string.maskFone(model['PESSOAS_CELULAR']),
								colSpan: 2								
							},{},
							{
								text: model['PESSOAS_CPFCNPJ'].length == 11 ? 'RG:' : 'Ies:'
							},
							{
								text: model['PESSOAS_INSCRICAO'],
								colSpan: 2
							},{}
						],
						[
							{
								text: 'Cidade:'
							},
							{
								text: model['CIDADES_NOME'],
								colSpan: 3
							},{},{},
							{
								text: 'UF:'
							}, 
							{
								text: model['CIDADES_ESTADO'],
							}, 
							{
								text: model['PESSOAS_CPFCNPJ'].length == 11 ? 'CPF:' : 'CNPJ:',
								style: {fontSize: 8},

							}, 
							{
								text: utils.string.maskCnp(model['PESSOAS_CPFCNPJ']),
								colSpan: 5								
							},{},{},{},{}
						],
						[
							{
								text: 'Obs:'
							},
							{
								text: obsPedido,
								colSpan: 11
							},{},{},{},{},{},{},{},{},{},{},
						],								
						[
							{ 
								text: '\n', 
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
								colSpan: 6							
							}, 
							{},{},{},{},{},
							{
								text: 'Marca',
								alignment: 'center',								
								colSpan: 2
							},{},
							{
								text: 'Qtde',
								alignment: 'center',
								colSpan: 2								
							},{},
							{
								text: 'Obs',
								alignment: 'center',
							}
						]
					);  // Fim do cabeçalho
						
					for(let i in produtos){

						let qtde = ((produtos[i]['ROMANEIOSITENS_QUANTIDADE'] - parseInt(produtos[i]['ROMANEIOSITENS_QUANTIDADE'])) != 0 ? produtos[i]['ROMANEIOSITENS_QUANTIDADE'].toFixed(3).replace('.',',') : produtos[i]['ROMANEIOSITENS_QUANTIDADE'].toFixed(0));
						
						qtde = qtde == '0' ? '' : qtde;

						if(qtde) {
							rows.push(
								[
									{							
										text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 6.5 
										}											
									},
									{
										text: produtos[i]['PRODUTOS_NOME'],
										colSpan: 6,
										style: {
											bold: true,
											fontSize: 8
										}
									},{},{},{},{},{},
									{
										text: produtos[i]['PRODUTOS_MARCA'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 6.5
										},										
										colSpan: 2
									}, {},
									{
										text: qtde,
										alignment: 'right',
										style: {
											fontSize: 8
										},
										colSpan: 2																											
									},{},
									{
										text: ' '
									}
								]
							)

							itensPagina++
							if(itensPagina > 12) {
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
					}

					rows.push( // Finaliza com o último rodapé
						[  
							{ 
								text: 'Retirada/Entrega referente à(s) venda(s): ' + model['MOVIMENTOS_NUMERO'] + ' ' + model['MOVIMENTOS_SERIE'] +  ' ' +
								      moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY') +
									  ' Funcionário que imprimiu: ' + impLog.split(' ')[0] +
									  ' Hora impressão: '          + impLog.split(' ')[2] + ' - ' + impLog.split(' ')[1],
								fontSize: 7,
								colSpan: 11,
								border: [false, true, false, false]
							},{},{},{},{},{},{},{},{},{},{},{
								text: '',
								border: [false, true, false, false]
							}
						]			
					);	
					
					rows.push(
						[
							{ 
								text: '\n', 
								style: {
									fontSize: 12
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
									fontSize: 12
								},
								colSpan: 12,
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{}
						],							
						[  
							{
								text: 'Entregador:',
								alignment: 'left',
								colSpan: 4,
								border: [false, true, false, false]
							},{},{},{},
							{
								text: '',
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: utils.string.firstUpper(model['MOVIMENTOS_NOME']) + ' ou\nrepresentante autorizado',
								style: {bold: true},
								alignment: 'center',
								colSpan: 6,
								border: [false, true, false, false],
							},{},{},{},{},{}
						]
					);
	
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
