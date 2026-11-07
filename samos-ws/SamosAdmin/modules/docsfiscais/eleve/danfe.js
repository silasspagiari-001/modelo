'use strict';

const fs        = require('fs');
const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const utils     = require('../../../services/samosUtils');
const codes     = require('rescode');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

codes.loadModules(['code128'], {"includetext" : false});

module.exports = {
    readById: (id, params) => { 
        return new Promise((resolve, reject) =>{
			api.movimentos().readById(id, params)
				.then(async res => {
					let model       = res.results[0];
					const motivoNfe = model['MOVIMENTOS_PROTOCOLO'] == ''  ? `Nf-e sem Protocolo/Cód Barras - Sem valor fiscal` :
    		                          model['MOVIMENTOS_STATUS']    == 'C' ? `Nf-e CANCELADA - Por motivo de emissão indevida` :
									  model['MOVIMENTOS_STATUS']    == 'D' ? `............Nf-e DENEGADA pela SEFAZ...........` :
									  model['MOVIMENTOS_STATUS']    == 'R' ? `.........NF-e RECUSADA pelo Destinatário.......` : ''

					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 0, 20, 20],
						background: [
							motivoNfe ?
							{  
								svg: `<svg><text
											transform="translate(50, 800) rotate(-50)"
											font-weight="bold"
											fill= "gray"
											style="font-size: 35px;"
										>
											${motivoNfe}
										</text>
										<rect x="20" y="712" width="312" height="100" fill="none" stroke="#000" stroke-width="1"></rect>
										<rect x="332" y="712" width="248" height="100" fill="none" stroke="#000" stroke-width="1"></rect>

										</svg>`
							} : {
								svg: `<svg><rect x="20" y="712" width="312" height="100" fill="none" stroke="#000" stroke-width="1"></rect>
										   <rect x="332" y="712" width="248" height="100" fill="none" stroke="#000" stroke-width="1"></rect>
									  </svg>`
							}		
						],									
						content: [
							{
								style: 'tableReport',
								table: { // Colunas (32)   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32 
									widths: [ 22,  6,  6,  8,  8,  8,  8,  8,  7,  7,  7,  5,  6,  6, 12, 12,  6,  8, 10, 10, 10,  8,  8,  8,  8,  8,  6,  6,  6,  6, 14, 14],
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
                    
					let nfeAjuste   = (model['OPERACOES_FINALIDADE'] == 'A' || model['OPERACOES_FINALIDADE'] == 'C');

					let msgIRRF = '';

					if(cents(model['MOVIMENTOS_VALORRETENCAO']) > 0) {
						msgIRRF = `IRRF retido conf. IN RFB nº 1.234/2012, arts. 2º-A e 3º-A.\nBase: R$ ${utils.number.float2moeda(model['MOVIMENTOS_TOTAL'])} - Alíquota: ${utils.number.float2moeda(model['PESSOAS_RETENCAO'])}% - IRRF: R$ ${utils.number.float2moeda(model['MOVIMENTOS_VALORRETENCAO'])}.\nValor líquido a pagar: R$ ${utils.number.float2moeda((cents(model['MOVIMENTOS_TOTAL']) - cents(model['MOVIMENTOS_VALORRETENCAO']))/100)}.`;
					}

					let linesObs = msgIRRF ? 7 : 10;

					let obsNfe      = model['MOVIMENTOS_OBSERVACOES'] ? model['MOVIMENTOS_OBSERVACOES'].split('|').slice(0, linesObs).join('\n') : ('\n').repeat(linesObs);
					
					let produtos    = model['MOVIMENTOS_ITENS'];
					let transporte  = model['MOVIMENTOS_ENVIO'][0] || [];
					let rows        = docDefinition.content[0].table.body;
                    const barcodes  = await getBarcode(model['MOVIMENTOS_NFE']);
					let pagina      = 1;				
					let paginas     = (produtos.length <= 13 ? 1 : Math.trunc(produtos.length / 13) + ((produtos.length % 13) > 0 ? 1: 0));
					let linhas;
					let itensPagina = 0;
					let pathLogo;
					const empCelular = utils.string.maskFone(model['EMPRESAS_CELULAR']);
					let semFrete = transporte['MOVIMENTOSENVIO_MODO'] == 'S' || transporte['MOVIMENTOSENVIO_MODO'] == 'T' || nfeAjuste;
					try {
						pathLogo = utils.client.getImagePath(`logos/nfe/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/default.png`;
					}
									
					let financeiros = (model['MOVIMENTOS_FINANCEIROS'] || []).filter(financeiro => {
						return (moment(financeiro['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY') == moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY') &&
						               financeiro['FINANCEIROS_NUMERO'] == model['MOVIMENTOS_NUMERO'] &&
						               financeiro['FINANCEIROS_ID_PESSOAS'] == model['MOVIMENTOS_ID_PESSOAS']);
					})

					let fatura01 = (financeiros.length > 0  ? `${model['MOVIMENTOS_NUMERO']}/01` : '');
					let fatura02 = (financeiros.length > 1  ? `${model['MOVIMENTOS_NUMERO']}/02` : '');
					let fatura03 = (financeiros.length > 2  ? `${model['MOVIMENTOS_NUMERO']}/03` : '');
					let fatura04 = (financeiros.length > 3  ? `${model['MOVIMENTOS_NUMERO']}/04` : '');
					let fatura05 = (financeiros.length > 4  ? `${model['MOVIMENTOS_NUMERO']}/05` : '');
					let fatura06 = (financeiros.length > 5  ? `${model['MOVIMENTOS_NUMERO']}/06` : '');
					let fatura07 = (financeiros.length > 6  ? `${model['MOVIMENTOS_NUMERO']}/07` : '');
					let fatura08 = (financeiros.length > 7  ? `${model['MOVIMENTOS_NUMERO']}/08` : '');
					let fatura09 = (financeiros.length > 8  ? `${model['MOVIMENTOS_NUMERO']}/09` : '');
					let fatura10 = (financeiros.length > 9  ? `${model['MOVIMENTOS_NUMERO']}/10` : '');
					let fatura11 = (financeiros.length > 10 ? `${model['MOVIMENTOS_NUMERO']}/11` : '');
					let fatura12 = (financeiros.length > 11 ? `${model['MOVIMENTOS_NUMERO']}/12` : '');

					let vencto01 = (financeiros.length > 0  ? moment(financeiros[0]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto02 = (financeiros.length > 1  ? moment(financeiros[1]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto03 = (financeiros.length > 2  ? moment(financeiros[2]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto04 = (financeiros.length > 3  ? moment(financeiros[3]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto05 = (financeiros.length > 4  ? moment(financeiros[4]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto06 = (financeiros.length > 5  ? moment(financeiros[5]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto07 = (financeiros.length > 6  ? moment(financeiros[6]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto08 = (financeiros.length > 7  ? moment(financeiros[7]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto09 = (financeiros.length > 8  ? moment(financeiros[8]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto10 = (financeiros.length > 9  ? moment(financeiros[9]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto11 = (financeiros.length > 10 ? moment(financeiros[10]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto12 = (financeiros.length > 11 ? moment(financeiros[11]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');

					let valor01 = (financeiros.length > 0  ? utils.number.float2moeda(financeiros[0]['FINANCEIROS_ORIGINAL']) : '');
					let valor02 = (financeiros.length > 1  ? utils.number.float2moeda(financeiros[1]['FINANCEIROS_ORIGINAL']) : '');
					let valor03 = (financeiros.length > 2  ? utils.number.float2moeda(financeiros[2]['FINANCEIROS_ORIGINAL']) : '');
					let valor04 = (financeiros.length > 3  ? utils.number.float2moeda(financeiros[3]['FINANCEIROS_ORIGINAL']) : '');
					let valor05 = (financeiros.length > 4  ? utils.number.float2moeda(financeiros[4]['FINANCEIROS_ORIGINAL']) : '');
					let valor06 = (financeiros.length > 5  ? utils.number.float2moeda(financeiros[5]['FINANCEIROS_ORIGINAL']) : '');
					let valor07 = (financeiros.length > 6  ? utils.number.float2moeda(financeiros[6]['FINANCEIROS_ORIGINAL']) : '');
					let valor08 = (financeiros.length > 7  ? utils.number.float2moeda(financeiros[7]['FINANCEIROS_ORIGINAL']) : '');
					let valor09 = (financeiros.length > 8  ? utils.number.float2moeda(financeiros[8]['FINANCEIROS_ORIGINAL']) : '');
					let valor10 = (financeiros.length > 9  ? utils.number.float2moeda(financeiros[9]['FINANCEIROS_ORIGINAL']) : '');
					let valor11 = (financeiros.length > 10 ? utils.number.float2moeda(financeiros[10]['FINANCEIROS_ORIGINAL']) : '');
					let valor12 = (financeiros.length > 11 ? utils.number.float2moeda(financeiros[11]['FINANCEIROS_ORIGINAL']) : '');
					
					for(let i in produtos){
						if(itensPagina > 14 || itensPagina == 0) { // Se primeiro passo do laço ou se já imprimiu uma página
							if(itensPagina > 0) {                  // Se já imprimiu alguma página fecha o rodapé
								pagina++;
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
													text: `Informações: ${(model['EMPRESAS_SIMPLES'] == 'T' || model['EMPRESAS_SIMPLES'] == '0' || model['EMPRESAS_SIMPLES'] == '2' ?
													'Empresa optante do simples nacional, não gera crédito de ICMS/IPI' : '')}\n`,					
													style: {fontSize: 7}
												},
												{ 
													text: parseInt(model['MOVIMENTOS_NUMEROORIGEM'] || '') > 0 ? `Ref: ${model['MOVIMENTOS_NUMEROORIGEM']}\n` : '',
													style: {fontSize: 7}
												},		
												{ 
													text: `${msgIRRF}${obsNfe}\n`,
													style: {fontSize: 8}
												}									
											],
											colSpan: 18,
											border: [false, false, false, false]
										}, 
										{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
										{
											text: 'RESERVADO AO FISCO',
											style: {fontSize: 7},
											border: [false, false, false, false],
											colSpan: 14
										},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]
								);			
							}

							// Aqui sempre é o cabeçalho do danfe, com o canhoto...
                            // com ou sem quebra de página
							if(pagina != 1) {
								rows.push([
									{
										text: '',
										fontSize: 2,
										pageBreak: 'before',
										colSpan: 32,
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]);    
							} else {
								rows.push([
									{
										text: '',
										fontSize: 2,
										colSpan: 32,
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]);    
							}
		
							// fim do condicional para quebra de página
							
							itensPagina = 0; // Zera o contador de itens							
							rows.push(
								[
									{
										text: `RECEBEMOS DE ${model['EMPRESAS_NOME']}, OS PRODUTOS/SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO:`,
										style: {fontSize: 6}, 
										border: [true, true, true, false],								
										colSpan: 26
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
									{
										text: `      NF-e\n  Nº           ${model['MOVIMENTOS_NUMERO']}`, alignment: 'center',
										colSpan: 6,
										border: [true, true, true, false],
										style: {fontSize: 10}
									},{},{},{},{},{}
								],
								[
									{
										text: 'DATA DE RECEBIMENTO',
										style: {fontSize: 6},								
										colSpan: 8,
										border: [true, true, true, true]
									},{},{},{},{},{},{},{},
									{   text: 'IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR',
										style: {fontSize: 6},
										colSpan: 18
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
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

							rows.push([
								{
									colSpan: 13,
									text: model['EMPRESAS_NOME'],
									alignment: 'center',
									border: [true, true, true, false],
									style: {bold: true,	fontSize: 9}
								},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 5,
									text: 'DANFE',
									alignment: 'center',
									border: [true, true, true, false],									
									style: {bold: true,	fontSize: 9}
								},{},{},{},{},
								{
									text: 'CONTROLE DO FISCO',
									colSpan: 14,
									border: [true, true, true, false]																		
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]);

							rows.push(
								[
									{
										image: `${pathLogo}`,
										colSpan: 4,
										width: 50,
										height: 50,
										alignment: 'center',
										border: [true, false, false, true]
									},{},{},{},
									{
										colSpan: 9,
										text: [
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
												text: (empCelular ? `Celular: ${empCelular}\n` : ''),
												alignment: 'left',
												style: {bold: true,	fontSize: 8}
											},
											{
												text: `${model['EMPRESAS_EMAIL']}`,
												alignment: 'left',
												style: {bold: true,	fontSize: 7.5}
											}
										],
										border: [false, false, true, true]
									},{},{},{},{},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{
												text: `Documento Auxiliar da\nNota Eletrônica\n`,
												alignment: 'center',
												style: {bold: true,	fontSize: 7}
											},
											{
												text: `1 = Saída\n2 = Entrada       `,
												alignment: 'left',
												style: {fontSize: 6}										
											},
											{
												text: (model['MOVIMENTOS_ID_OPERACOES'] > 500000 ? '1' : '2'),
												alignment: 'left',
												style: {bold: true,	fontSize: 10}										
											},
											{
												text: `\nNº ${model['MOVIMENTOS_NUMERO']} Série 01 Página ${pagina}/${paginas}`,
												alignment: 'center',
												style: {bold: true,	fontSize: 8}										
											},

										],
										border: [true, false, true, true]
									},
									{},{},{},{},
									{ 
										colSpan: 14,
										border: [false, false, true, false],
										table: {
											body: [
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
										{text: `Número do protocolo de Autorização de uso da NF-e\n`, style: {fontSize: 6}},
										{text: `${utils.string.maskProtocoloNfe(model['MOVIMENTOS_PROTOCOLO'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: `Chave de acesso da NF-e para consulta de autenticação no site www.fazenda.gov.br\n`, alignment: 'center', style: {fontSize: 6}},
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
										{text: `${model['MOVIMENTOS_NOME']} (${model['MOVIMENTOS_ID_PESSOAS']})`, alignment: 'left', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 7,
									text: [
										{text: `CNPJ/CPF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${utils.string.maskCnp(model['PESSOAS_CPFCNPJ'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Data de Emissão\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${moment(model['MOVIMENTOS_EMISSAO']).isSameOrBefore('1900-01-01') ? '' : moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: `${moment(model['MOVIMENTOS_ENTRADASAIDA']).isSameOrBefore('1900-01-01') ? '' : moment(model['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY')}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
//										{text: `${model['MOVIMENTOS_HORA']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{}],
								[
									{ 
										text: 'FATURA\n',
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
									colSpan: 3,
									text: [
										{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${fatura01}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura02}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura03}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura04}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${vencto01}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto02}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto03}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto04}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${valor01}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor02}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor03}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor04}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 3,
									text: [
										{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${fatura05}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura06}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura07}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura08}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}

									]
								},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${vencto05}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto06}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto07}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto08}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 3,
									text: [
										{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${valor05}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor06}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor07}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor08}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},
								{
									colSpan: 3,
									text: [
										{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${fatura09}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura10}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura11}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura12}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${vencto09}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto10}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto11}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto12}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${valor09}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor10}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor11}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor12}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{}],
								[
									{ 
										text: 'CÁLCULO DE IMPOSTO\n',
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
									colSpan: 6,
									text: [
										{text: `Base de Cálculo do ICMS\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_BASEICMS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor do ICMS\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_VALORICMS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Base de Cálculo ST\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_BASEST']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor ICMS ST\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_VALORST']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor do Desconto\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']), alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Valor Produtos\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}]
							);

							rows.push(
								[
									{
										colSpan: 6,
										text: [
											{text: `Valor do Frete\n`, alignment: 'center', style: {fontSize: 6}},
											{text: nfeAjuste ? '\n' : utils.number.float2moeda(model['MOVIMENTOS_FRETE']), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{text: `Valor do Seguro\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_SEGURO']), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{text: `Valor Despesas\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_DESPESAS']), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{text: `Valor do IPI\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_VALORIPI']), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{text: `Valor Tributos - IBPT\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_IMPOSTO']), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},
									{
										colSpan: 6,
										text: [
											{text: `Valor Total\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},{}
								],
								[
									{ 
										text: 'TOTAIS IBS / CBS / IMPOSTO SELETIVO\n',
										alignment: 'left',
										style: {fontSize: 6},
										colSpan: 32,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 6,
										text: [
											{text: `Base de Cálculo do IBS/CBS\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_BASEIBSCBS'], true), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{text: `Alíquota IBS\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_ALIQUOTAIBS'], true), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{text: `Valor IBS\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_VALORIBS'], true), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{text: `Alíquota CBS\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_ALIQUOTACBS'], true), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{text: `Valor CBS\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda(model['MOVIMENTOS_VALORCBS'], true), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},
									{
										colSpan: 6,
										text: [
											{text: `Valor Total (IBS/CBS)\n`, alignment: 'center', style: {fontSize: 6}},
											{text: utils.number.float2moeda((model['MOVIMENTOS_VALORIBS'] + model['MOVIMENTOS_VALORCBS']), true), alignment: 'center', style: {fontSize: 8, bold: true}},
										]
									},{},{},{},{},{}
								],
								[
									{ 
										text: 'TRANSPORTADOR/VOLUME TRANSPORTADO\n',
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
									colSpan: 14,
									text: [
										{text: `Nome/Razão Social\n`, alignment: 'left', style: {fontSize: 6}},
										{text: nfeAjuste ? '' : transporte['MOVIMENTOSENVIO_NOME'] || ' ', alignment: 'left', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{
											text: `Frete por Conta\n1 = Emitente        3 = Terceiros\n2 = Destinatário  4 = Sem Frete`,
											alignment: 'left',
											style: {fontSize: 5}										
										}
									],
									border: [true, true, false, true]
								},{},{},{},{},
								{
									text: [
										{
											text: 'a\n', color: 'white', style: {fontSize: 4},
										},
										{
											text: (semFrete ? '4' :
											       transporte['MOVIMENTOSENVIO_MODO'] == 'C' ? '1' : 
											       transporte['MOVIMENTOSENVIO_MODO'] == 'F' ? '2' :
												   transporte['MOVIMENTOSENVIO_MODO'] == 'T' ? '3' : '4'),
											alignment: 'left',
											style: {bold: true,	fontSize: 10},

										}
									],
									border: [false, true, true, true]
								},
								{
									colSpan: 4,
									text: [
										{text: `Placa Veículo\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_PLACA']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},
								{
									colSpan: 2,
									text: [
										{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_PLACAUF']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},
								{
									colSpan: 6,
									text: [
										{text: `CPF/CNPJ\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : utils.string.maskCnp(transporte['MOVIMENTOSENVIO_CPFCNPJ'])), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}]
							);

							rows.push(
								[{
									colSpan: 14,
									text: [
										{text: `Endereço\n`, alignment: 'left', style: {fontSize: 6}},
										{text: (semFrete ? '\n' : `${transporte['MOVIMENTOSENVIO_ENDERECO']} ${transporte['MOVIMENTOSENVIO_NUMERO']} `), alignment: 'left', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 10,
									text: [
										{text: `Município\n`, alignment: 'left', style: {fontSize: 6}},
										{text: (semFrete ? '\n' : transporte['CIDADES_NOME']), alignment: 'left', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 2,
									text: [
										{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : transporte['CIDADES_ESTADO']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},
								{
									colSpan: 6,
									text: [
										{text: `Inscrição Estadual\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_INSCRICAO']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}]
							);		
							rows.push(
								[{
									colSpan: 5,
									text: [
										{text: `Quantidade\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '\n' : transporte['MOVIMENTOSENVIO_QUANTIDADE'] || ' '), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Espécie\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_ESPECIE']), alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Marca\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_MARCA']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Volumes\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_VOLUMES']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Peso Bruto\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_PESOBRUTO'] || ''), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Peso Líquido\n`, alignment: 'center', style: {fontSize: 6}},
										{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_PESOLIQUIDO'] || ''), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},						
							],
							[
								{ 
									text: 'DADOS DOS PRODUTOS/SERVIÇOS\n',
									alignment: 'left',
									style: {fontSize: 6},
									colSpan: 32,									
									border: [false, false, false, false]
								}, 
								{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],
							[
								{   // Coluna 1
									text: 'Código',	alignment: 'center', style: {fontSize: 6, bold: true}
								},
								{
									text: 'Descrição dos Produtos',	alignment: 'left', style: {fontSize: 6, bold: true},
									colSpan: 10
								}, // Colunas 2 a 11
								{},{},{},{},{},{},{},{},{},
								{  // Colunas 12 a 14
									colSpan: 3,
									text: 'NCM/SH',
									alignment: 'center', style: {fontSize: 6, bold: true}		
								},{},{},
								{   // Coluna 15
									text: 'Cfop',
									style: {fontSize: 5, bold: true}
								},
								{   // Coluna 16
									text: 'Cst',
									style: {fontSize: 5, bold: true}
								},
								{   // Coluna 17 e 18
									colSpan: 2,
									text: 'Qtde',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},
								{   // Coluna 19
									text: 'Un',
									alignment: 'center', style: {fontSize: 5, bold: true}
								},
								{   // Coluna 20 e 21
									colSpan: 2,
									text: 'Preço',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},
								{   // Coluna 22 a 24
									colSpan: 3,
									text: 'Vlr. Total',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},{},
								{   // Coluna 25 e 26
									colSpan: 2,
									text: 'Base Icms',
									style: {fontSize: 5, bold: true}
								},{},
								{   // Coluna 27 e 28
									colSpan: 2,
									text: 'Vlr. Icms',
									style: {fontSize: 5, bold: true}
								},{},
								{   // Coluna 29 e 30
									colSpan: 2,
									text: 'Vlr. Ipi',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},
								{   // Coluna 31
									text: 'Icms',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},
								{   // Coluna 32
									text: 'Ipi',
									alignment: 'center', style: {fontSize: 6, bold: true}
								}
							]
							);
						}

						let precoUnitario = (produtos[i]['MOVIMENTOSITENS_PRECO'].toString().length <= produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).length ?
											utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']) :
											produtos[i]['MOVIMENTOSITENS_PRECO'].toString().replace('.', ','))

						let tamFomProduto = produtos[i]['PRODUTOS_NOME'].length > 50 ? 4 : 5; //4 e 6
                        
						rows.push(
							[
								{
									text: nfeAjuste ? '\n' : produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'], alignment: 'center', style: {fontSize: 6}
								},
								{
									text: nfeAjuste ? '' : produtos[i]['PRODUTOS_NOME'].substring(0, 70), alignment: 'left', style: {fontSize: tamFomProduto}, // Q-44 F-6
									colSpan: 10
								}, 
								{},{},{},{},{},{},{},{},{},
								{
									colSpan: 3,
									text: nfeAjuste ? '' : produtos[i]['NCMS_NCM'],
									alignment: 'center', style: {fontSize: 6}		
								},{},{},
								{
									text: nfeAjuste ? '' : parseInt(produtos[i]['MOVIMENTOSITENS_ID_OPERACOES'] / 100),
									style: {fontSize: 5}
								},
								{
									text: nfeAjuste ? '' : produtos[i]['MOVIMENTOSITENS_CST'],
									alignment: 'center', style: {fontSize: 5}
								},
								{
									colSpan: 2,
									text: nfeAjuste ? '' : produtos[i]['MOVIMENTOSITENS_QUANTIDADE'],
									alignment: 'right', style: {fontSize: 6}
								},{},
								{
									text: nfeAjuste ? '' : produtos[i]['PRODUTOS_UNIDADE'],
									alignment: 'center', style: {fontSize: 6}
								},
								{
									colSpan: 2,
									text: nfeAjuste ? '' : precoUnitario,
									alignment: 'right', style: {fontSize: 6}
								},{},
								{
									colSpan: 3,
									text: nfeAjuste ? '' : utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_TOTAL']),
									alignment: 'right', style: {fontSize: 6}
								},{},{},
								{
									colSpan: 2,
									text: nfeAjuste ? '' : utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_BASEICMS']) || '',
									alignment: 'right',
									style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: nfeAjuste ? '' : utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_VALORICMS']) || '',
									alignment: 'right', style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: nfeAjuste ? '' : utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_VALORIPI']) || '',
									alignment: 'right', style: {fontSize: 6}
								},{},
								{
									text: nfeAjuste ? '' : produtos[i]['MOVIMENTOSITENS_ICMS'] || '',
									alignment: 'right', style: {fontSize: 6}
								},
								{
									text: nfeAjuste ? '' : produtos[i]['MOVIMENTOSITENS_IPI'] || '',
									alignment: 'right', style: {fontSize: 6}
								}
		
							]
						)
						itensPagina++
					}


					for (linhas = itensPagina; linhas < 13; linhas++) {  // Aqui completamos a grid com linhas em branco
						rows.push(
							[
								{
									text: ' ', style: {fontSize: 6}
								},
								{
									colSpan: 10,									
									text: ' ', style: {fontSize: 6},
								}, 
								{},{},{},{},{},{},{},{},{},
								{
									colSpan: 3,
									text: ' ', style: {fontSize: 6}
								},{},{},
								{
									text: ' ', style: {fontSize: 5}
								},
								{
									text: ' ', style: {fontSize: 5}
								},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 6}
								},{},
								{
									text: ' ', style: {fontSize: 6}
								},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 6}
								},{},
								{
									colSpan: 3,
									text: ' ', style: {fontSize: 6}
								},{},{},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 6}
								},{},
								{
									text: ' ', style: {fontSize: 6}
								},
								{
									text: ' ', style: {fontSize: 6}
								}		
							]
						)
					}
					
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
										text: `Informações: ${(model['EMPRESAS_SIMPLES'] == 'T' || model['EMPRESAS_SIMPLES'] == '0' ?
										'Empresa optante do simples nacional, não gera crédito de ICMS/IPI' : '')}\n`,		
										style: {fontSize: 7}
									},
									{ 
										text: parseInt(model['MOVIMENTOS_NUMEROORIGEM'] || '') > 0 ? `Ref: ${model['MOVIMENTOS_NUMEROORIGEM']}\n` : '',
										style: {fontSize: 7}
									},
									{ 
										text: `${msgIRRF}${obsNfe}\n`,
										style: {fontSize: 8}
									}									
								],
								colSpan: 18,
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								text: 'RESERVADO AO FISCO',
								style: {fontSize: 7},
								colSpan: 14,
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{}
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

const getBarcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('code128', chave);
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};