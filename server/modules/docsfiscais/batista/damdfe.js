'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const utils     = require('../../../services/samosUtils');
const codes     = require('rescode');
const moment    = require('moment-timezone');

codes.loadModules(['code128'], {"includetext" : false});
codes.loadModules(['qrcode'], {"includetext" : false});

module.exports = {
    readById: async (id, params) => { 
        try {
			const queryManifestos = await api.manifestos().readById(id, params);
			const model = queryManifestos.results[0];

			const docDefinition = {
				pageOrientation: 'portrait', 
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 20],
				background: [
				],									
				content: [
					{
						style: 'tableReport',
						table: { // Colunas (16x26)
									// [26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26],
							widths: [26, 26, 26, 26, 26, 26, 26, 20, 22, 22, 22, 22, 30, 30, 30, 36],
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

			const rows = docDefinition.content[0].table.body;
									
			const emiMan = moment(model['MANIFESTOS_EMISSAO']).isSameOrBefore('1900-01-01') ? '' : moment(model['MANIFESTOS_EMISSAO']).format('DD/MM/YYYY');
			const notas = model['MANIFESTOS_ITENS'];

			const barcodes  = (codes.create('code128', model['MANIFESTOS_NFE']) || '').toString('base64')
			const qrcodes   = (codes.create('qrcode', model['MANIFESTOS_NFE']) || '').toString('base64')
			
			let pagina = 1;				
			const paginas = Math.round(notas.length / 15) + ((notas.length % 15) > 0 ? 1: 0);
			let itensPagina = 0;
			
			let pathLogo;

			try {
				pathLogo = utils.client.getImagePath(`logos/nfe/${model['EMPRESAS_CPFCNPJ']}.png`, params);
			} catch(error) {
				pathLogo = `${appRoot}/resources/images/nfe/default.png`;
			}
				
			for(let i in notas){
				if(itensPagina > 12 || itensPagina == 0) { // Se primeiro passo do laço ou se já imprimiu uma página
					if(itensPagina > 0) {                  // Se já imprimiu alguma página fecha o rodapé
						rows.push(
							[
								{ 
									text: ' ',
									style: {
										fontSize: 0.5
									},
									colSpan: 16,									
									border: [true, false, true, true]
								}, 
								{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],

						)								
						pagina++;
					}

					itensPagina = 0; // Zera o contador de itens	
											
					rows.push(
						[
							{
								colSpan: 16,
								text: [
									{
										text: `\n${model['EMPRESAS_NOME']}\n\n`,
										alignment: 'center',
										style: {bold: true,	fontSize: 14}
									}
								],
								border: [true, true, true, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								image: `${pathLogo}`,
								fit: [90, 90],
								colSpan: 3,
								width: 50,
								alignment: 'center',
								border: [true, false, false, true]
							},{},{},
							{
								colSpan: 10,
								text: [
									{
										text: [
											{text: `CNPJ: `, style: {bold: true, fontSize: 10}},
											{text: `${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ'])} `, style: {fontSize: 10}},
										]
									},
									{
										text: [
											{text: `Inscrição: `, style: {bold: true, fontSize: 10}},
											{text: `${model['EMPRESAS_INSCRICAO']}\n\n`, style: {fontSize: 10}},
										]
									},
									{
										text: `${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									},
									{
										text: `${utils.string.maskCep(model['EMPRESAS_CEP'])} ${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									},
									{
										text: `E-mail: ${model['EMPRESAS_EMAIL']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									},

									{
										text: `Fone: ${utils.string.maskFone(model['EMPRESAS_TELEFONE'])}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									},

									{
										text: `Celular: ${utils.string.maskFone(model['EMPRESAS_CELULAR'])}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									}
								],
								border: [false, false, false, true]
							},{},{},{},{},{},{},{},{},{},
							{text: ' ', border: [false, false, false, true]},
							{
								border: [false, false, false, true],
								table: {
									body: [
										[
											qrcodes ? {
												image: 'data:image/png;base64,' + qrcodes,
												width: 70,
												height: 70,
												alignment: 'center'
											} : ''
										]
									]
								},
								layout: 'noBorders'
							},
							{text: ' ', border: [false, false, true, true]},									
						],
						[
							{ 
								text: '\n',
								style: {
									fontSize: 1
								},
								colSpan: 16,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 3,
								text: [
									{ 
										text: '\n',
										style: {
											fontSize: 6
										}
									},
									{
										text: `DAMDFE`,
										alignment: 'center',
										style: {bold: true,	fontSize: 18}
									}
								],
								border: [true, true, false, true]
							},{},{},
							{
								colSpan: 13,
								text: [
									{
										text: `\nDocumento Auxiliar de Manifesto Eletrônico de Documentos Fiscais\n\n`,
										alignment: 'center',
										style: {bold: true,	fontSize: 11}
									}
								],
								border: [false, true, true, true]
							},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{ 
								text: '\n',
								style: {
									fontSize: 1
								},
								colSpan: 16,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{ text: ' ', border: [true, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ 
								border: [false, true, false, false],
								table: {
									body: [
										[
											{text: 'CONTROLE DO FISCO', style: {fontSize: 8}, alignment: 'center'},
										],												 
										[
											barcodes ? {
												image: 'data:image/png;base64,' + barcodes,
												width: 230,
												height: 50
											} : ''
										]
									]
								},
								layout: 'noBorders'
							},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, false, true]},
							{ text: ' ', border: [false, true, true, true]}
						],
						[
							{
								colSpan: 16,
								text: [
									{ 
										text: 'Chave de acesso\n',
										alignment: 'left',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${utils.string.maskChaveNfe(model['MANIFESTOS_NFE'])}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 10}
									}
								]
							},{},{},

						],
						[
							{
								colSpan: 16,
								text: [
									{ 
										text: 'Protocolo de Autorização de Uso\n',
										alignment: 'left',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${utils.string.maskProtocoloNfe(model['MANIFESTOS_PROTOCOLO']) || ' '}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 10}
									}
								]
							},{},{},

						],
						[
							{ 
								text: '\n',
								style: {
									fontSize: 1
								},
								colSpan: 16,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 2,
								text: [
									{ 
										text: 'MODELO\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `58`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'SÉRIE\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `1`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'NÚMERO\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${model['MANIFESTOS_NUMERO']}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'FL\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${pagina}/${paginas}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 4,
								text: [
									{ 
										text: 'DATA E HORA DA EMISSÃO\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${emiMan}\n${model['MANIFESTOS_HORA']}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 10}
									}
								]
							},{},{},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'UF CARRREG.\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${model['MANIFESTOS_PERCURSOINICIAL']}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'UF DESCARRREG.\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${model['MANIFESTOS_PERCURSOFINAL']}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{}
						],
						[
							{ 
								text: '\n',
								style: {
									fontSize: 0.5
								},
								colSpan: 16,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 2,
								text: [
									{ 
										text: 'CIOT\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${model['MANIFESTOS_CIOT'] || ''}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'QTD. CT-E\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${model['MANIFESTOS_QUANTIDADECFE'] || ''}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'QTD. CTRC\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: ``,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'QTD. NF-E\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${model['MANIFESTOS_QUANTIDADENFE'] || ''}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 4,
								text: [
									{ 
										text: 'QTD. NF\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: ``,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},{},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'QTD. MDF-E\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: ``,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},
							{
								colSpan: 2,
								text: [
									{ 
										text: 'PESO TOTAL (KG)\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${utils.number.float2moeda(model['MANIFESTOS_PESOBRUTO']) || ''}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{}
						],
						[
							{ 
								colSpan: 4,
								text: [
									{ 
										text: 'Placa\n\n',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${model['MANIFESTOS_PLACAVEICULO'] || ' '}\n`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},{},{},
							{
								colSpan: 4,
								text: [
									{ 
										text: 'RNTC\n\n',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									},
									{
										text: `${model['MANIFESTOS_RNTC'] || ''}\n`,
										alignment: 'center',
										style: {bold: true,	fontSize: 12}
									}
								]
							},{},{},{},
							{
								colSpan: 4,
								text: [
									{ 
										text: 'CPF/CNPJ Transportador',
										alignment: 'center',
										style: {
											fontSize: 8
										}
									}
								],
								border: [true, true, true, false]										
							},{},{},{},{
								colSpan: 4,
								text: [
									{ 
										text: 'Nome Transportador',
										alignment: 'center',
										style: {
											fontSize: 8
										},

									}
								],
								border: [true, true, true, false]										
							},{},{},{}
						],
						[
							{
								text: 'VALE PEDÁGIO',
								style: {fontSize: 8},
								colSpan: 8,
							},{},{},{},{},{},{},{},
							{
								colSpan: 4,										
								text: `${utils.string.maskCnp(model['TRANSPORTES_CPFCNPJ']) || ''}`,
								style: {fontSize: 10, bold: true},
								alignment: 'center',
								border: [true, false, true, false]
							},{},{},{},{
								colSpan: 4,										
								text: `${model['TRANSPORTES_NOME'] || ''}`,
								style: {fontSize: 8, bold: true},
								alignment: 'center',
								border: [true, false, true, false]										
							},{},{},{}
						],
						[
							{
								colSpan: 3,
								text: 
								[
									{text: 'Responsável CNPJ\n', style: {fontSize: 8}},
									{text: '\n', style: {fontSize: 12}}
								]
							},{},{},{
								text: 'Fornecedor CNPJ\n',
								style: {fontSize: 8},
								colSpan: 3,
							},{},{},{
								text: 'Nº Comprovante\n',
								style: {fontSize: 6},
								colSpan: 2,
							},{},
							{
								colSpan: 4,										
								text: ` `,
								style: {fontSize: 10},
								border: [true, false, true, true]
							},{},{},{},{
								colSpan: 4,										
								text: ` `,
								style: {fontSize: 8},
								alignment: 'center',
								border: [true, false, true, true]										
							},{},{},{}
						],
						[
							{ 
								text: '\n',
								style: {
									fontSize: 12
								},
								colSpan: 16,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{ 
								text: 'Relação dos Documentos Fiscais',
								alignment: 'center',
								style: {
									fontSize: 12, bold: true
								},
								colSpan: 16							
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{ 
								text: 'Chave Documento',
								style: {
									fontSize: 12, bold: true
								},
								colSpan: 16
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						]
					);
				}

				rows.push(
					[
						{
							colSpan: 16,
							text: notas[i]['MANIFESTOSITENS_NFE'], style: {fontSize: 12},
							border: [true, false, true, false]
						},
						{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
					]
				)
				itensPagina++
			}

			for (let linhas = itensPagina; linhas < 12; linhas++) {  // Aqui completamos a grid com linhas em branco
				rows.push(
					[
						{
							colSpan: 16,
							text: ' ',
							style: {fontSize: 12},
							border: [true, false, true, false]
						},
						{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
					]
				)						
			}
			
			rows.push( // fecha o rodapé
				[
					{ 
						text: ' ',
						style: {
							fontSize: 0.5
						},
						colSpan: 16,									
						border: [true, false, true, true]
					}, 
					{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
				]
			);	

			const pdfName = await pdfStream(docDefinition);

			return { results: [ { name: pdfName } ] }
				
		} catch(error) {
			const msg = 'Falha ao gerar damdfe';
			console.log(msg);
			console.log(error);
			throw { msg, error };
		}
    }
};