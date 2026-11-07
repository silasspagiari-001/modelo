'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const codes = require('rescode');
codes.loadModules(['interleaved2of5'], {"includetext" : false});

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',                //   E   S   D   I
 			pageMargins: [20, 20, 20, 15], // [20, 10, 20, 10]
			content: [
				{
					style: 'tableReport',
					table: {   // 32 Colunas                                             [ Linha digitável (original 8 posições em todos)                      ]
						       //  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32
						widths: [  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
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
					let logoBanco = ('000' + res.results[0]['PORTADORES_ID_BANCOS']).slice(-3);
					let digitoBanco = getDvBanco(res.results[0]['PORTADORES_ID_BANCOS']);

					let localPagamento = '';

					if(logoBanco == '237') {  // Bradesco
					   localPagamento = 'Pagável preferencialmente na Rede Bradesco ou Bradesco Expresso';
					} else if(logoBanco == '748') { //Sicredi
						localPagamento = `PAGAVEL PREFERENCIALMENTE NAS COOPERATIVAS DE CREDITO DO SICREDI`;
					} else {
						localPagamento = `Qualquer banco até o vencimento`;
					}

					for(let i in res.results){

						let model           = res.results[i];
						let NumeroDocumento = `${('00' + model['FINANCEIROS_ID_EMPRESAS']).slice(-2)}${('000000' + model['FINANCEIROS_NUMERO']).slice(-6)}${('000' + model['FINANCEIROS_PARCELA']).slice(-3)}${model['FINANCEIROS_SERIE']}`;
						let digitonNumero   = model['FINANCEIROS_BOLETO'].split('|')[1] || '';
						let nossoNumero     = logoBanco == '748' ? `${ moment( model['FINANCEIROS_EMISSAO'] ).format('YY') }/${('00000' + model['FINANCEIROS_NOSSONUMERO']).slice(-5)}-${digitonNumero}` : 
						                                           `${model['PORTADORES_CARTEIRA']}/${('00000000000' + model['FINANCEIROS_NOSSONUMERO']).slice(-11)}-${digitonNumero}`;
						let emiTitulo       = moment(model['FINANCEIROS_EMISSAO']    || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(model['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY');
						let vctTitulo       = moment(model['FINANCEIROS_VENCIMENTO'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(model['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY');
						let linhaDigitavel  = utils.string.maskLinhaBoleto(model['FINANCEIROS_BOLETO'].split('|')[0]);
						let msgProtesto     = (parseInt(model['PORTADORES_PROTESTO']) > 0 ? `Protesto no ${model['PORTADORES_PROTESTO']}º dia após vencimento.` : '');
						let vlrJuros        = (((model['FINANCEIROS_ABERTO'] / 100) * model['PORTADORES_MORA'])/30);
						let vlrMora         = ((model['FINANCEIROS_ABERTO'] / 100) * model['PORTADORES_MULTA']);
						let msgJuros        = (model['PORTADORES_MORA']  > 0 && vlrJuros > 0 ? `Cobrar juros de R$ ${utils.number.float2moeda(vlrJuros)} por dia de atraso para pagamento após o vencimento.` : '');
						let msgMulta        = (model['PORTADORES_MULTA'] > 0 && vlrMora > 0 ? `Cobrar multa de R$ ${utils.number.float2moeda(vlrMora)} para pagamento após o vencimento.` : '');
						let codigoBarras    = calcula_barra(model['FINANCEIROS_BOLETO'].split('|')[0]);

						const barcodes = await getBarcode(codigoBarras);

						rows.push([
							{
								colSpan: 9,
								image: `${appRoot}/resources/images/logosbanco/${logoBanco}.png`,
								width: 90,
								alignment: 'center',
								border: [false, false, true, true]
							},{},{},{},{},{},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `\n`, style: {fontSize: 6}},
									{
										text: `${logoBanco}${digitoBanco}`,
										style: {fontSize: 16, bold: true},
										alignment: 'center'
									}
								],
								border: [true, false, false, true]
							},{},{},{},{},
							{   
								colSpan: 17,
								text: [
									{text: `\n`, style: {fontSize: 6}},
									{
										text: `Comprovante de Entrega`,
										style: {fontSize: 12, bold: true},
										alignment: 'right'
									}
								],
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{
								text: '', border: [false, false, false, true]
							}
						]);

						rows.push(  // Beneficiário
							[{
								colSpan: 14,
								text: [
									{text: `Beneficiário\n`, alignment: 'left', style: {fontSize: 6}},
									{text: `${model['PORTADORES_NOME'].slice(0, 40)}`, alignment: 'left', style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: logoBanco == '748' ? [
									{text: `Agência/Código do Beneficiário\n`,style: {fontSize: 6, bold: true}},
									{text: `${model['PORTADORES_AGENCIA'].split('-')[0]}/23/${model['PORTADORES_CONTA'].split('-')[0]}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								] : [
									{text: `Agência/Código do Beneficiário\n`,style: {fontSize: 6, bold: true}},
									{text: `${model['PORTADORES_AGENCIA']}/${model['PORTADORES_CONTA']}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								]
							},{},{},{},{},{},{},{},
							{
								colSpan: 10,
								text: [
									{text: `Motivo de não entrega (Para uso da empresa entregadora)\n\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
									{text: `( ) Mudou-se              ( ) Ausente              ( ) Não existe No`, style: {fontSize: 6, bold: true}}
								],
								border: [true, true, false, false]
							},{},{},{},{},{},{},{},{},{}
						]);

						rows.push(  // Pagador
							[{
								colSpan: 14,
								text: [
									{text: `Pagador\n`, alignment: 'left', style: {fontSize: 6}},
									{text: `${model['PESSOAS_NOME'].slice(0, 40)}`, alignment: 'left', style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `Nosso Número\n`, style: {fontSize: 6}},
									{text: `${nossoNumero}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								]
							},{},{},{},{},{},{},{},
							{
								colSpan: 10,
								text: [
									{text: `( ) Recusado              ( ) Não procurado   ( ) Endereço insuficiente`, style: {fontSize: 6, bold: true}}
								],
								border: [true, false, false, false]
							},{},{},{},{},{},{},{},{},{}
						]);				

						rows.push(  // Vencimento
							[{
								colSpan: 4,
								text: [
									{text: `Vencimento\n`, alignment: 'left', style: {fontSize: 6}},
									{text: `${vctTitulo}`, alignment: 'center', style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, true]
							},{},{},{},
							{
								colSpan: 7,
								text: [
									{text: `Número do Documento\n`, style: {fontSize: 6}},
									{text: `${NumeroDocumento}`, alignment: 'center', style: {fontSize: 8, bold: true}}
								]
							},{},{},{},{},{},{},
							{
								colSpan: 3,
								text: [
									{text: `Espécie\n`, alignment: 'center', style: {fontSize: 6}},
									{text: `R$`, alignment: 'center', style: {fontSize: 8, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},
							{
								colSpan: 8,
								text: [
									{text: `Valor do Documento\n`, style: {fontSize: 6}},
									{text: `${utils.number.float2moeda(model['FINANCEIROS_ABERTO'])}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								]
							},{},{},{},{},{},{},{},
							{
								colSpan: 10,
								text: [
									{text: `( ) Desconhecido       ( ) Falecido             ( ) Outros (anotar no verso)`, style: {fontSize: 6, bold: true}}
								],
								border: [true, false, false, false]
							},{},{},{},{},{},{},{},{},{}
						]);

						rows.push(  // Recebemos o título
							[{
								colSpan: 12,
								text: [
									{text: `Recebemos o título\n`, style: {fontSize: 6}},
									{text: `com as características acima`, style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, true]
							},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 3,
								text: [
									{text: `Data\n`, style: {fontSize: 6}},
									{text: ` `, alignment: 'center', style: {fontSize: 8, bold: true}}
								]
							},{},{},
							{
								colSpan: 7,
								text: [
									{text: `Assinatura\n`, alignment: 'center', style: {fontSize: 6, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},
							{
								colSpan: 3,
								text: [
									{text: `Data\n`, style: {fontSize: 6}},
									{text: ` `, alignment: 'right', style: {fontSize: 8, bold: true}}
								]
							},{},{},
							{
								colSpan: 7,
								text: [
									{text: `Assinatura\n`, alignment: 'center', style: {fontSize: 6, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{}
						]);

						rows.push(  // Local de pagamento
							[{
								colSpan: 26,
								text: [
									{text: `Local de pagamento\n`, style: {fontSize: 6}},
									{text: localPagamento, style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 6,
								text: [
									{text: `Data do processamento\n`, style: {fontSize: 6, bold: true}},
									{text: `${emiTitulo}`, alignment: 'center', style: {fontSize: 8, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{}
						],
						[
							{
								colSpan: 32,
								text: '- - '.repeat(64), style: {fontSize: 8},
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						]);

// Segundo bloco (logo)

						rows.push([
							{
								colSpan: 9,
								image: `${appRoot}/resources/images/logosbanco/${logoBanco}.png`,
								width: 90,
								alignment: 'center',
								border: [false, false, true, true]
							},{},{},{},{},{},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `\n`, style: {fontSize: 6}},
									{
										text: `${logoBanco}${digitoBanco}`,
										style: {fontSize: 16, bold: true},
										alignment: 'center'
									}
								],
								border: [true, false, false, true]
							},{},{},{},{},
							{   
								colSpan: 17,
								text: [
									{text: `\n`, style: {fontSize: 6}},
									{
										text: `Recibo do Pagador`,
										style: {fontSize: 12, bold: true},
										alignment: 'right'
									}
								],
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{
								text: '', border: [false, false, false, true]
							}
						]);

						rows.push(  // Beneficiário
							[{
								colSpan: 14,
								text: [
									{text: `Beneficiário\n`, alignment: 'left', style: {fontSize: 6}},
									{text: `${model['PORTADORES_NOME'].slice(0, 40)}`, alignment: 'left', style: {fontSize: 8, bold: true}}
								],
								border: [false, true, false, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 6,
								text: [
									{text: `CNPJ/CPF\n`, style: {fontSize: 6}},
									{text: `${utils.string.maskCnp(model['PORTADORES_CPFCNPJ'])}`, style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, true]
							},{},{},{},{},{},
							{
								colSpan: 4,
								text: [
									{text: `Sacador/Avalista\n`, style: {fontSize: 6}}
								],
								border: [false, true, true, true]
							},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `Vencimento\n`, alignment: 'left', style: {fontSize: 6, bold: true}},
									{text: `${vctTitulo}`, alignment: 'center', style: {fontSize: 10, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
						]);

						rows.push(
							[{
								colSpan: 32,
								text: [
									{text: `Endereço do Beneficiário\n`, alignment: 'left', style: {fontSize: 6}},
									{
										text: `${model['PORTADORES_ENDERECO'].slice(0, 40)}, ${model['PORTADORES_NUMERO']} - ${model['PORTADORES_BAIRRO'].slice(0, 20)} - ${model['CIDADES_NOMEPORTADOR'].slice(0, 25)}/${model['CIDADES_ESTADOPORTADOR']} ${utils.string.maskCep(model['PORTADORES_CEP'])}`,
										style: {fontSize: 8, bold: true}}
								],
								border: [false, true, false, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						]);				

						rows.push(
							[{
								colSpan: 10,
								text: [
									{text: `Nosso Número\n`, alignment: 'left', style: {fontSize: 6}},
									{text: `${nossoNumero}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, true]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 3,
								text: [
									{text: `Carteira\n`, style: {fontSize: 6}},
									{text: model['PORTADORES_CARTEIRA'], alignment: 'center', style: {fontSize: 8, bold: true}}
								]
							},{},{},
							{
								colSpan: 3,
								text: [
									{text: `Espécie\n`, style: {fontSize: 6}},
									{text: `R$`, alignment: 'center', style: {fontSize: 8, bold: true}}									
								],
								border: [true, true, false, true]
							},{},{},
							{
								colSpan: 4,
								text: [
									{text: `Quantidade\n`, style: {fontSize: 6}}
								]
							},{},{},{},
							{
								colSpan: 4,
								text: [
									{text: `(x) Valor\n`, style: {fontSize: 6}}
								]
							},{},{},{},
							{
								colSpan: 8,
								text: logoBanco == '748' ? [
									{text: `Agência/Código do Beneficiário\n`,style: {fontSize: 6, bold: true}},
									{text: `${model['PORTADORES_AGENCIA'].split('-')[0]}/23/${model['PORTADORES_CONTA'].split('-')[0]}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								] : [
									{text: `Agência/Código do Beneficiário\n`,style: {fontSize: 6, bold: true}},
									{text: `${model['PORTADORES_AGENCIA']}/${model['PORTADORES_CONTA']}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
						]);

						rows.push(
							[{
								colSpan: 5,
								text: [
									{text: `Data do documento\n`, style: {fontSize: 6}},
									{text: `${emiTitulo}`, alignment: 'center', style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, true]
							},{},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `Número do documento\n`, style: {fontSize: 6}},
									{text: `${NumeroDocumento}`, alignment: 'center', style: {fontSize: 8, bold: true}}
								]
							},{},{},{},{},
							{
								colSpan: 4,
								text: [
									{text: `Espécie Documento\n`, alignment: 'center', style: {fontSize: 5}},
									{text: `DM`, alignment: 'center', style: {fontSize: 8, bold: true}}									
								],
								border: [true, true, false, true]
							},{},{},{},
							{
								colSpan: 3,
								text: [
									{text: `Aceite\n`, style: {fontSize: 6}},
									{text: `Não`, alignment: 'center', style: {fontSize: 8, bold: true}}
								]
							},{},{},
							{
								colSpan: 7,
								text: [
									{text: `Data do Processamento\n`, style: {fontSize: 6, bold: true}},
									{text: `${emiTitulo}`, alignment: 'center', style: {fontSize: 8, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `(=) Valor do Documento\n`,style: {fontSize: 6, bold: true}},
									{text: `${utils.number.float2moeda(model['FINANCEIROS_ABERTO'])}`, alignment: 'right', style: {fontSize: 9, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}

						]);

						rows.push(
							[{
								colSpan: 24,
								text: [
									{text: `Instruções de responsabilidade do BENEFICIÁRIO. Qualquer dúvida sobre este boleto, contate o BENEFICIÁRIO\n`, style: {fontSize: 5}},
									{text: ``, style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `(-) Desconto\n`, style: {fontSize: 6, bold: true}},
									{text: ` `, style: {fontSize: 8}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
							],
							[
								{
									colSpan: 24,
									text: [
										{text: `\n`, style: {fontSize: 5}},
										{text: `${msgProtesto}`, style: {fontSize: 8}}
									],
									border: [false, false, true, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 8,
									text: [
										{text: `(-) Outras Deduções/Abatimento\n`, style: {fontSize: 6, bold: true}},
										{text: ` `, style: {fontSize: 8}}
									],
									border: [true, true, false, true]
								},{},{},{},{},{},{},{}
							],
							[{
							colSpan: 24,
							text: [
								{text: `\n`, style: {fontSize: 5}},
								{text: `${msgJuros}`, style: {fontSize: 8}}
							],
							border: [false, false, true, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `(+) Mora/Multa/Juros\n`, style: {fontSize: 6, bold: true}},
									{text: ` `, style: {fontSize: 8}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
							],
							[{
								colSpan: 24,
								text: [
									{text: `\n`, style: {fontSize: 5}},
									{text: `${msgMulta}`, style: {fontSize: 8}}									
								],
								border: [false, false, true, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 8,
									text: [
										{text: `(+) Outros Acréscimos\n`, style: {fontSize: 6, bold: true}},
										{text: ` `, style: {fontSize: 8}}
									],
									border: [true, true, false, true]
								},{},{},{},{},{},{},{}
							],
							[{
								colSpan: 24,
								text: [
									{text: ` `, style: {fontSize: 5}}
								],
								border: [false, false, true, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `(=) Valor Cobrado\n`, style: {fontSize: 6, bold: true}},
									{text: ` `, style: {fontSize: 8}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
							]
						);

						rows.push(
							[
								{
									colSpan: 3,
									text: [
										{text: `Pagador:\nEndereço:`, style: {fontSize: 8}},
									],
									border: [false, true, false, false]
								},{},{},
								{
									colSpan: 29,
									text: [
										{text: `${model['PESSOAS_NOME']}      CPF/CNPJ: ${utils.string.maskCnp(model['PESSOAS_CPFCNPJ'])}\n${model['PESSOAS_ENDERECO'].slice(0, 40)}, ${model['PESSOAS_NUMERO']} - ${model['PESSOAS_BAIRRO'].slice(0, 20)} - ${utils.string.maskCep(model['PESSOAS_CEP'])} - ${model['CIDADES_NOME'].slice(0, 25)}/${model['CIDADES_ESTADO']}`, style: {fontSize: 9}},
									],
									border: [false, true, false, false]
								},
								{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],
							[
								{
									colSpan: 12,
									text: [
										{text: `Sacador/Avalista:`, style: {fontSize: 8}},
										{text: ``, style: {fontSize: 8, bold: true}}
									],
									border: [false, false, false, true]
								},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 11,
									text: [
										{text: `CPF/CNPJ:`, style: {fontSize: 8}},
									],
									border: [false, false, false, true]
								},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 9,
									text: [
										{text: `Código de Baixa:`, style: {fontSize: 7, bold: true}},
									],
									border: [false, false, false, true]
								},{},{},{},{},{},{},{},{}
							],
							[
								{
									colSpan: 20,
									text: [
										{text: `Recebemos através do cheque número                         do banco\n`, style: {fontSize: 6}},
										{text: `Esta quitação só terá validade após o pagamento do cheque pelo\nbanco sacado.`, style: {fontSize: 6}}
									],
									border: [false, true, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{
									colSpan: 12,
									text: [
										{text: `Autenticação Mecânica`, style: {fontSize: 7}}
									],
									border: [false, true, false, false]
								},{},{},{},{},{},{},{},{},{},{},{}
							],
							[
								{
									colSpan: 32,
									text: '- - '.repeat(64), style: {fontSize: 8},
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]							
						);
// Último bloco (Logo)...
						rows.push([
							{
								colSpan: 9,
								image: `${appRoot}/resources/images/logosbanco/${logoBanco}.png`,
								width: 90,
								alignment: 'center',
								border: [false, false, true, true]
							},{},{},{},{},{},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `\n`, style: {fontSize: 6}},
									{
										text: `${logoBanco}${digitoBanco}`,
										style: {fontSize: 16, bold: true},
										alignment: 'center'
									}
								],
								border: [true, false, false, true]
							},{},{},{},{},
							{   
								colSpan: 18,
								text: [
									{text: `\n`, style: {fontSize: 11}},
									{
										text: `${linhaDigitavel}`,
										style: {fontSize: 11, bold: true}
									}
								],
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						]);

						rows.push(  // Local de pagamento
							[{
								colSpan: 24,
								text: [
									{text: `Local de pagamento\n`, alignment: 'left', style: {fontSize: 6}},
									{text: localPagamento, alignment: 'left', style: {fontSize: 8, bold: true}}
								],
								border: [false, true, false, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `Vencimento\n`, alignment: 'left', style: {fontSize: 6, bold: true}},
									{text: `${vctTitulo}`, alignment: 'center', style: {fontSize: 10, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
						]);

						rows.push(  // Nome do beneficiário
							[{
								colSpan: 18,
								text: [
									{text: `Beneficiário\n`, style: {fontSize: 6}},
									{
										text: `${model['PORTADORES_NOME']}`, style: {fontSize: 8, bold: true}
									},
								],
								border: [false, true, false, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 6,
								text: [
									{text: `CNPJ/CPF\n`, style: {fontSize: 6}},
									{text: `${utils.string.maskCnp(model['PORTADORES_CPFCNPJ'])}`, style: {fontSize: 8, bold: true}}
								],
								border: [false, true, false, true]
							},{},{},{},{},{},
							{
								colSpan: 8,
								text: logoBanco == '748' ? [
									{text: `Agência/Código do Beneficiário\n`,style: {fontSize: 6, bold: true}},
									{text: `${model['PORTADORES_AGENCIA'].split('-')[0]}/23/${model['PORTADORES_CONTA'].split('-')[0]}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								] : [
									{text: `Agência/Código do Beneficiário\n`,style: {fontSize: 6, bold: true}},
									{text: `${model['PORTADORES_AGENCIA']}/${model['PORTADORES_CONTA']}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								],
								border: [true, true, false, true]

							},{},{},{},{},{},{},{}
						]);				

						rows.push(  // Data do documento
							[{
								colSpan: 5,
								text: [
									{text: `Data do documento\n`, style: {fontSize: 6}},
									{text: `${emiTitulo}`, alignment: 'center', style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, true]
							},{},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `Número do documento\n`, style: {fontSize: 6}},
									{text: `${NumeroDocumento}`, alignment: 'center', style: {fontSize: 8, bold: true}}
								]
							},{},{},{},{},
							{
								colSpan: 4,
								text: [
									{text: `Espécie Documento\n`, alignment: 'center', style: {fontSize: 5}},
									{text: `DM`, alignment: 'center', style: {fontSize: 8, bold: true}}									
								],
								border: [true, true, false, true]
							},{},{},{},
							{
								colSpan: 3,
								text: [
									{text: `Aceite\n`, style: {fontSize: 6}},
									{text: `Não`, alignment: 'center', style: {fontSize: 8, bold: true}}
								]
							},{},{},
							{
								colSpan: 7,
								text: [
									{text: `Data do Processamento\n`, style: {fontSize: 6, bold: true}},
									{text: `${emiTitulo}`, alignment: 'center', style: {fontSize: 8, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `Nosso Número\n`,style: {fontSize: 6, bold: true}},
									{text: `${nossoNumero}`, alignment: 'right', style: {fontSize: 8, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
						]);

						rows.push(
							[{
								colSpan: 6,
								text: [
									{text: `Uso do Banco\n`, alignment: 'left', style: {fontSize: 6}},
								],
								border: [false, true, true, true]
							},{},{},{},{},{},
							{
								colSpan: 4,
								text: [
									{text: `Carteira\n`, style: {fontSize: 6}},
									{text: model['PORTADORES_CARTEIRA'], alignment: 'center', style: {fontSize: 8, bold: true}}
								]
							},{},{},{},
							{
								colSpan: 4,
								text: [
									{text: `Espécie\n`, style: {fontSize: 6}},
									{text: `R$`, alignment: 'center', style: {fontSize: 8, bold: true}}									
								],
								border: [true, true, false, true]
							},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `Quantidade\n`, style: {fontSize: 6}}
								]
							},{},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `Valor\n`, style: {fontSize: 6}}
								]
							},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `(=) Valor do Documento\n`, style: {fontSize: 6}},
									{text: `${utils.number.float2moeda(model['FINANCEIROS_ABERTO'])}`, alignment: 'right', style: {fontSize: 9, bold: true}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
						]);

						rows.push(  // Instruções
							[{
								colSpan: 24,
								text: [
									{text: `Instruções de responsabilidade do BENEFICIÁRIO. Qualquer dúvida sobre este boleto, contate o BENEFICIÁRIO\n`, style: {fontSize: 5}},
									{text: ``, style: {fontSize: 8, bold: true}}
								],
								border: [false, true, true, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `(-) Desconto\n`, style: {fontSize: 6, bold: true}},
									{text: ` `, style: {fontSize: 8}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
							],
							[
								{
									colSpan: 24,
									text: [
										{text: `\n`, style: {fontSize: 5}},
										{text: `${msgProtesto}`, style: {fontSize: 8}}
									],
									border: [false, false, true, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 8,
									text: [
										{text: `(-) Outras Deduções/Abatimento\n`, style: {fontSize: 6, bold: true}},
										{text: ` `, style: {fontSize: 8}}
									],
									border: [true, true, false, true]
								},{},{},{},{},{},{},{}
							],
							[{
							colSpan: 24,
							text: [
								{text: `\n`, style: {fontSize: 5}},
								{text: `${msgJuros}`, style: {fontSize: 8}}
							],
							border: [false, false, true, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `(+) Mora/Multa/Juros\n`, style: {fontSize: 6, bold: true}},
									{text: ` `, style: {fontSize: 8}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
							],
							[{
								colSpan: 24,
								text: [
									{text: `\n`, style: {fontSize: 5}},
									{text: `${msgMulta}`, style: {fontSize: 8}}									
								],
								border: [false, false, true, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 8,
									text: [
										{text: `(+) Outros Acréscimos\n`, style: {fontSize: 6, bold: true}},
										{text: ` `, style: {fontSize: 8}}
									],
									border: [true, true, false, true]
								},{},{},{},{},{},{},{}
							],
							[{
								colSpan: 24,
								text: [
									{text: ` `, style: {fontSize: 5}}
								],
								border: [false, false, true, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 8,
								text: [
									{text: `(=) Valor Cobrado\n`, style: {fontSize: 6, bold: true}},
									{text: ` `, style: {fontSize: 8}}
								],
								border: [true, true, false, true]
							},{},{},{},{},{},{},{}
							]
						);

						rows.push(
							[
								{
									colSpan: 3,
									text: [
										{text: `Pagador:\nEndereço:`, style: {fontSize: 8}},
									],
									border: [false, true, false, false]
								},{},{},
								{
									colSpan: 17,
									text: [
										{text: `${model['PESSOAS_NOME']}\n${model['PESSOAS_ENDERECO']}, ${model['PESSOAS_NUMERO']}\n${model['PESSOAS_BAIRRO']}\n${utils.string.maskCep(model['PESSOAS_CEP'])} - ${model['CIDADES_NOME']}/${model['CIDADES_ESTADO']}`, style: {fontSize: 9}},
									],
									border: [false, true, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 3,
									text: [
										{text: `CPF/CNPJ:`, style: {fontSize: 8}},
									],
									border: [false, true, false, false]
								},{},{},
								{
									colSpan: 9,
									text: [
										{text: `${utils.string.maskCnp(model['PESSOAS_CPFCNPJ'])}`, style: {fontSize: 9}},
									],
									border: [false, true, false, false]
								},{},{},{},{},{},{},{},{}
							],
							[
								{
									colSpan: 12,
									text: [
										{text: `Sacador/Avalista:`, style: {fontSize: 8}},
										{text: ``, style: {fontSize: 8, bold: true}}
									],
									border: [false, false, false, true]
								},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 11,
									text: [
										{text: `CPF/CNPJ:`, style: {fontSize: 8}},
									],
									border: [false, false, false, true]
								},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 9,
									text: [
										{text: `Código de Baixa:`, style: {fontSize: 7, bold: true}},
									],
									border: [false, false, false, true]
								},{},{},{},{},{},{},{},{}
							],
							[
								{
									colSpan: 20,
									border: [false, false, false, false],
									table: {
										body: [
											[ 
												barcodes ? {
													image: 'data:image/png;base64,' + barcodes,
													width: 280, // 280
													height: 35,
													alignment: 'center'														
												} : ''
											]
										]
									},
									layout: 'noBorders'
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 12,
									border: [false, true, false, false],									
									text: 'Autenticação Mecânica / FICHA DE COMPENSAÇÃO',
									alignment: 'center'									
								},{},{},{},{},{},{},{},{},{},{},{}
							]
						);
					} 
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const getBarcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('interleaved2of5', chave);  // code128
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};

const getDvBanco = function(banco) {
	let digitoBanco = '';

	if(banco == 1)   {digitoBanco = '-9'};  // Banco do Brasil (ok)
	if(banco == 237) {digitoBanco = '-2'};  // Bradesco        (ok)
	if(banco == 341) {digitoBanco = '-7'};  // Itau            (ok)
	if(banco == 748) {digitoBanco = '-X'};  // SICREDI         (ok)	
	if(banco == 756) {digitoBanco = '-0'};  // SICOOB          (ok)
	if(banco == 33)  {digitoBanco = '-7'};  // Santander       (ok)
	if(banco == 104) {digitoBanco = '-0'};  // Caixa           (ok)

	return digitoBanco;
};

function calcula_barra(linha)
{

    let barra  = linha.replace(/[^0-9]/g,'');
    
    if (modulo11_banco('34191000000000000001753980229122525005423000') != 1) {
		console.log('Função "modulo11_banco" está com erro!');
	}	
    if (barra.length < 47 ) barra = barra + '00000000000'.substr(0,47-barra.length);
    if (barra.length != 47) {
		console.log('A linha do código de barras está incompleta!'+barra.length);
	}

    barra  = barra.substr(0,4)
            +barra.substr(32,15)
            +barra.substr(4,5)
            +barra.substr(10,10)
            +barra.substr(21,10)
            ;

    if (modulo11_banco(barra.substr(0,4)+barra.substr(5,39)) != barra.substr(4,1)) {
		console.log('Digito verificador '+barra.substr(4,1)+', o correto é '+modulo11_banco(barra.substr(0,4)+barra.substr(5,39))+'\nO sistema não altera automaticamente o dígito correto na quinta casa!');
	}
        
    return(barra);
};

function modulo11_banco(numero)
{

    numero = numero.replace(/[^0-9]/g,'');

    var soma  = 0;
    var peso  = 2;
    var base  = 9;
    var resto = 0;
    var contador = numero.length - 1;

	for (var i=contador; i >= 0; i--) {

        soma = soma + ( numero.substring(i,i+1) * peso);

        if (peso < base) {
            peso++;
        } else {
            peso = 2;
        }
    }
    var digito = 11 - (soma % 11);

    if (digito >  9) digito = 0;

    if (digito == 0) digito = 1;
     return digito;
    }