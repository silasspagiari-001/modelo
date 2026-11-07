'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const utils     = require('../../../services/samosUtils');
const codes     = require('rescode');
const moment    = require('moment-timezone');

codes.loadModules(['code128'], {"includetext" : false});

module.exports = {
    readById: async (id, params) => { 
        try {
			const queryCartas = await api.movimentoscartas().readById(id, params);
			const model = queryCartas.results[0];
			const semProto = model['MOVIMENTOSCARTAS_PROTOCOLO'] == '' ? `CC-e sem Protocolo/Cód Barras - Sem valor fiscal` : '';

			const docDefinition = {
				pageOrientation: 'portrait', 
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 20],
				background: [
					semProto ?
					{  
						svg: `<svg><text
									transform="translate(50, 800) rotate(-50)"
									font-weight="bold"
									fill= "gray"
									style="font-size: 35px;"
								>
									${semProto}
								</text></svg>`
					} : null
				],									
				content: [
					{
						style: 'tableReport',
						table: { // Colunas (32)
							widths: [ 20,  8,  6,  8,  8,  8,  8,  8,  7,  7,  7,  7,  8,  8, 12, 12,  6,  8,  8,  8,  8,  8,  8,  8,  8,  8,  6,  6,  6,  6, 14, 14],
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

			const saiCce = moment(model['MOVIMENTOSCARTAS_ENVIO']).isSameOrBefore('1900-01-01') ? '' : moment(model['MOVIMENTOSCARTAS_ENVIO']).format('DD/MM/YYYY');
			
			const rows = docDefinition.content[0].table.body;

			const barcodes = (codes.create('code128', model['MOVIMENTOS_NFE']) || '').toString("base64");
			
			let pathLogo;

			try {
				pathLogo = utils.client.getImagePath(`logos/nfe/${model['EMPRESAS_CPFCNPJ']}.png`, params);
			} catch(error) {
				pathLogo = `${appRoot}/resources/images/nfe/default.png`;
			}

			rows.push(
				[
					{
						text: [
							{text: '\n', style: {fontSize: 8}},
							{
								text: `Carta de Correção`,
								alignment: 'center',
								style: {fontSize: 24}
							}
						],
						border: [true, true, true, true],										
						colSpan: 26,
						rowSpan: 2
					},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
					{

						text: `Referente NF-e\nNº ${model['MOVIMENTOS_NUMERO']}`, alignment: 'center',
						colSpan: 6,
						border: [true, true, true, false],
						style: {fontSize: 10}
					},{},{},{},{},{}
				],
				[
					{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
					{
						text: [
							{text: 'a\n', fontSize: 6, color: 'white'},
							{text: '  SÉRIE:\n', alignment: 'right',
							style: {fontSize: 10}},
						],
						border: [true, true, false, true],
						colSpan: 3
					},{},{},
					{
						text: [
							{text: 'a\n', fontSize: 6, color: 'white'},
							{text: '01\n', alignment: 'left',
							style: {fontSize: 10}},
						],
						border: [false, true, true, true],
						colSpan: 3
					},{},{}
				],
				[
					{ 
						text: ' -'.repeat(66),
						colSpan: 32,
						style: {
							fontSize: 16
						},
						border: [false, false, false, false]
					},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}

				]
			);

			rows.push(
				[
					{
						image: `${pathLogo}`,
						fit: [75, 75],
						colSpan: 4,
						width: 50,
						alignment: 'center',
						border: [true, true, false, true]
					},{},{},{},
					{
						colSpan: 14,
						text: [
							{
								text: model['EMPRESAS_NOME'] + '\n',
								alignment: 'left',
								style: {bold: true,	fontSize: 9}
							},
							{
								text: `${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']}\n`,
								alignment: 'left',
								style: {bold: true,	fontSize: 8}
							},
							{
								text: `${model['EMPRESAS_BAIRRO']}\n`,
								alignment: 'left',
								style: {bold: true,	fontSize: 8}
							},
							{
								text: `${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}\n`,
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
							},
							{
								text: `${model['EMPRESAS_EMAIL']}\n`,
								alignment: 'left',
								style: {bold: true,	fontSize: 7.5}
							}
						],
						border: [false, true, true, true]
					},{},{},{},{},{},{},{},{},{},{},{},{},{},
					{ 
						colSpan: 14,
						table: {
							body: [
								['CONTROLE DO FISCO'],
								[ 
									barcodes ? {
										image: 'data:image/png;base64,' + barcodes,
										width: 230,
										height: 50,
										alignment: 'center'														
									} : ''
								]
							]
						},
						layout: 'noBorders'
					},{},{},{},{},{},{},{},{},{},{},{},{},{}
				],
				[
					{ 
						text: '\n',
						style: {
							fontSize: 1
						},
						colSpan: 32,									
						border: [false, false, false, false]
					}, 
					{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
				]
			);
						
			rows.push(
				[{
					colSpan: 18,
					text: [
						{text: `Natureza da Operação\n`, style: {fontSize: 6}},
						{text: `${model['OPERACOES_NOME']}`, style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
				{
					colSpan: 14,
					text: [
						{text: `Número do protocolo de Autorização de uso na SEFAZ\n`, style: {fontSize: 6}},
						{text: `${utils.string.maskProtocoloNfe(model['MOVIMENTOSCARTAS_PROTOCOLO'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{},{},{},{},{},{},{},{},{}
				],
				[
					{ 
						text: '\n',
						style: {
							fontSize: 1
						},
						colSpan: 32,									
						border: [false, false, false, false]
					}, 
					{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
				]
			);

			rows.push(
				[{
					colSpan: 4,
					text: [
						{text: `Inscrição Estadual\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${model['EMPRESAS_INSCRICAO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},
				{
					colSpan: 4,
					text: [
						{text: `Insc Est do Subst Tributário`, alignment: 'center', style: {fontSize: 6}}
					]
				},{},{},{},
				{
					colSpan: 5,
					text: [
						{text: `CNPJ\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ'])}`, alignment: 'center', style: {fontSize: 7, bold: true}}
					]
				},{},{},{},{},
				{
					colSpan: 19,
					text: [
						{text: `Chave de acesso da CC-e para consulta de autenticação no site www.fazenda.gov.br\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${utils.string.maskChaveNfe(model['MOVIMENTOS_NFE'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
				],
				[
					{ 
						text: 'DESTINATÁRIO/REMETENTE\n', // divisão de bloco 
						alignment: 'left',
						style: {fontSize: 6},
						colSpan: 32,									
						border: [false, false, false, false]
					}, 
					{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
				]
			);
			
			rows.push(
				[{
					colSpan: 19,
					text: [
						{text: `Nome/Razão Social\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${model['MOVIMENTOS_NOME']}`, alignment: 'left', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
				{
					colSpan: 7,
					text: [
						{text: `CNPJ/CPF\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${utils.string.maskCnp(model['MOVIMENTOS_CPFCNPJ'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{},{},
				{
					colSpan: 6,
					text: [
						{text: `Data de Emissão\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${model['MOVIMENTOSCARTAS_EMISSAO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{}]
			);

			rows.push(
				[{
					colSpan: 13,
					text: [
						{text: `Endereço\n`, alignment: 'left', style: {fontSize: 6}},
						{text: `${model['PESSOAS_ENDERECO']}`, alignment: 'left', style: {fontSize: (model['PESSOAS_ENDERECO'].length > 40 ? 7 : 8), bold: true}}
					]
				},{},{},{},{},{},{},{},{},{},{},{},{},
				{
					colSpan: 3,
					text: [
						{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${utils.string.maskCnp(model['PESSOAS_NUMERO'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},						
				{
					colSpan: 6,
					text: [
						{text: `Bairro\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${model['PESSOAS_BAIRRO']}`, alignment: 'center', style: {fontSize: (model['PESSOAS_BAIRRO'].length > 20 ? 5 : 8), bold: true}}
					]
				},{},{},{},{},{},
				{
					colSpan: 4,
					text: [
						{text: `CEP\n`, alignment: 'left', style: {fontSize: 6}},
						{text: `${utils.string.maskCep(model['PESSOAS_CEP'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},
				{
					colSpan: 6,
					text: [
						{text: `Data de Saída/Entrada\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${saiCce}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{}]
			);

			rows.push(
				[{
					colSpan: 12,
					text: [
						{text: `Município\n`, alignment: 'left', style: {fontSize: 6}},
						{text: `${model['CIDADES_NOME']}`, alignment: 'left', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{},{},{},{},{},{},{},
				{
					colSpan: 5,
					text: [
						{text: `Telefone\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${utils.string.maskFone(model['PESSOAS_TELEFONE'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},
				{
					colSpan: 2,
					text: [
						{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${model['CIDADES_ESTADO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},
				{
					colSpan: 7,
					text: [
						{text: `Inscrição Estadual\n`, alignment: 'left', style: {fontSize: 6}},
						{text: `${model['PESSOAS_INSCRICAO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{},{},
				{
					colSpan: 6,
					text: [
						{text: `Hora de Saída\n`, alignment: 'center', style: {fontSize: 6}},
						{text: `${model['MOVIMENTOSCARTAS_HORA']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
					]
				},{},{},{},{},{}]
			);

			let itensPagina = 0; // Zera o contador de itens

			const correcoesCce = model['MOVIMENTOSCARTAS_CORRECOES'] ? model['MOVIMENTOSCARTAS_CORRECOES'].split('|') : [];

			for(let i in correcoesCce){
				rows.push(
					[
						{
							colSpan: 32,
							text: `${correcoesCce[i] || ' '}`,	alignment: 'center', style: {fontSize: 12, bold: true}, border: [true, false, true, false]
						},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
					]
				);

				itensPagina++;
			}

			// Aqui completamos a grid com linhas em branco
			for (let linhas = itensPagina; linhas < 20; linhas++) {
				rows.push(
					[
						{
							colSpan: 32,
							text: ' ',	style: {fontSize: 12}, border: [true, false, true, false]
						},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
					]
				)
			}

			rows.push(
				[
					{
						colSpan: 32,
						text: ' ',	style: {fontSize: 12}, border: [true, false, true, true]
					},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
				]
			)
			
			rows.push(
				[
					{ 
						text: 'DADOS ADICIONAIS\n',
						alignment: 'left',
						style: {fontSize: 6},
						colSpan: 25,									
						border: [false, false, false, false]
					}, 
					{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{
						text: 'www.samos.com.br',
						alignment: 'right',
						style: {fontSize: 7},
						colSpan: 7,									
						border: [false, false, false, false]
					},{},{},{},{},{},{}
				],
				[
					{ 
						text: [
							{ 
								text: `Informações: \n`,
								style: {fontSize: 7}
							},
							{ 
								text: `\n\n\n\n\n\n\n\n`,
								style: {fontSize: 8}
							}									
						],
						colSpan: 18
					}, 
					{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
					{
						text: 'RESERVADO AO FISCO',
						style: {fontSize: 7},
						colSpan: 14
					},{},{},{},{},{},{},{},{},{},{},{},{},{}
				]
			);

			const pdfName = await pdfStream(docDefinition);

			return { results: [ { name: pdfName } ] }
		} catch(error) {
			const msg = 'Falha ao gerar ccnfe';
			console.log(msg);
			console.log(error);
			throw { msg, error };
		}
    }
};