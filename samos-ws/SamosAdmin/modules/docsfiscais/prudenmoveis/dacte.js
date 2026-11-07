'use strict';

const fs        = require('fs');
const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const utils     = require('../../../services/samosUtils');
const codes     = require('rescode');
const moment    = require('moment-timezone');

codes.loadModules(['code128'], {"includetext" : false});

module.exports = {
    readById: (id, params) => { 
        return new Promise((resolve, reject) =>{
			api.conhecimento().readById(id, params)
				.then(async res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 20],
						background: [],
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
                    						
					let model       = res.results[0];
					let obsNfe      = (model['CONHECIMENTOS_OBSERVACOES'] ? model['CONHECIMENTOS_OBSERVACOES'].split('|').slice(0, 5).join('\n') : '\n\n\n\n\n');
					const emiNfe    = moment(model['CONHECIMENTOS_EMISSAO']);
					const saiNfe    = moment(model['CONHECIMENTOS_ENTRADASAIDA']);
					let produtos    = model['CONHECIMENTOS_ITENS'];
					let transporte  = model['CONHECIMENTOS_ENVIO'][0] || [];
					let rows        = docDefinition.content[0].table.body;
                    const barcodes  = await getBarcode(model['CONHECIMENTOS_NFE']);
					let pagina      = 1;				
					let paginas     = Math.round(produtos.length / 19) + ((produtos.length % 19) > 0 ? 1: 0);
					let linhas;
					let itensPagina = 0;
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/nfe/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/default.png`;
					}
									
					let financeiros     = model['CONHECIMENTOS_FINANCEIROS'] || [];

					let fatura01 = (financeiros.length > 0  ? `${model['CONHECIMENTOS_NUMERO']}/01` : '');
					let fatura02 = (financeiros.length > 1  ? `${model['CONHECIMENTOS_NUMERO']}/02` : '');
					let fatura03 = (financeiros.length > 2  ? `${model['CONHECIMENTOS_NUMERO']}/03` : '');
					let fatura04 = (financeiros.length > 3  ? `${model['CONHECIMENTOS_NUMERO']}/04` : '');
					let fatura05 = (financeiros.length > 4  ? `${model['CONHECIMENTOS_NUMERO']}/05` : '');
					let fatura06 = (financeiros.length > 5  ? `${model['CONHECIMENTOS_NUMERO']}/06` : '');
					let fatura07 = (financeiros.length > 6  ? `${model['CONHECIMENTOS_NUMERO']}/07` : '');
					let fatura08 = (financeiros.length > 7  ? `${model['CONHECIMENTOS_NUMERO']}/08` : '');
					let fatura09 = (financeiros.length > 8  ? `${model['CONHECIMENTOS_NUMERO']}/09` : '');
					let fatura10 = (financeiros.length > 9  ? `${model['CONHECIMENTOS_NUMERO']}/10` : '');
					let fatura11 = (financeiros.length > 10 ? `${model['CONHECIMENTOS_NUMERO']}/11` : '');
					let fatura12 = (financeiros.length > 11 ? `${model['CONHECIMENTOS_NUMERO']}/12` : '');

					let vencto01 = (financeiros.length > 0  ? moment(financeiros[0]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto02 = (financeiros.length > 1  ? moment(financeiros[1]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto03 = (financeiros.length > 2  ? moment(financeiros[2]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto04 = (financeiros.length > 3  ? moment(financeiros[3]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto05 = (financeiros.length > 4  ? moment(financeiros[4]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto06 = (financeiros.length > 5  ? moment(financeiros[5]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto07 = (financeiros.length > 6  ? moment(financeiros[6]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto08 = (financeiros.length > 7  ? moment(financeiros[7]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto09 = (financeiros.length > 8  ? moment(financeiros[8]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto10 = (financeiros.length > 9  ? moment(financeiros[9]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto11 = (financeiros.length > 10 ? moment(financeiros[10]['FINANCEIROS_VENCIMENTO']) : '');
					let vencto12 = (financeiros.length > 11 ? moment(financeiros[11]['FINANCEIROS_VENCIMENTO']) : '');

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
						if(itensPagina > 18 || itensPagina == 0) { // Se primeiro passo do laço ou se já imprimiu uma página
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
													text: `Informações: ${(model['EMPRESAS_SIMPLES'] == 'T' ?
													'Empresa optante do simples nacional, não gera crédito de ICMS/IPI' : '')}\n`,
													style: {fontSize: 7}
												},
												{ 
													text: `${obsNfe}`,
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
							}
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
										text: `      NF-e\n  Nº           ${model['CONHECIMENTOS_NUMERO']}`, alignment: 'center',
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
										colSpan: 9,
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
									},{},{},{},{},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{
												text: `DACTE\n`,
												alignment: 'center',
												style: {fontSize: 10}
											},
											{
												text: `Documento Auxiliar do\nConhecimento Eletrônico\n`,
												alignment: 'center',
												style: {bold: true,	fontSize: 7}
											},
											{
												text: `1 = Saída\n2 = Entrada       `,
												alignment: 'left',
												style: {fontSize: 6}										
											},
											{
												text: (model['CONHECIMENTOS_ID_OPERACOES'] > 500000 ? '1' : '2'),
												alignment: 'left',
												style: {bold: true,	fontSize: 10}										
											},
											{
												text: `\nNº ${model['CONHECIMENTOS_NUMERO']} Série 01 Página ${pagina}/${paginas}`,
												alignment: 'center',
												style: {bold: true,	fontSize: 8}										
											},

										]
									},
									{},{},{},{},
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
										{text: `Número do protocolo de Autorização de uso da NF-e\n`, style: {fontSize: 6}},
										{text: `${utils.string.maskProtocoloNfe(model['CONHECIMENTOS_PROTOCOLO'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: `${utils.string.maskChaveNfe(model['CONHECIMENTOS_NFE'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: `${model['CONHECIMENTOS_NOME']}`, alignment: 'left', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 7,
									text: [
										{text: `CNPJ/CPF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${utils.string.maskCnp(model['CONHECIMENTOS_CPFCNPJ'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Data de Emissão\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${emiNfe.isSameOrBefore('1900-01-01') ? '' : emiNfe.format('DD/MM/YYYY')}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: `${saiNfe.isSameOrBefore('1900-01-01') ? '' : saiNfe.format('DD/MM/YYYY')}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: `${model['CONHECIMENTOS_HORA']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: `${vencto01.isSameOrBefore('1900-01-01') ? '' : vencto01.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto02.isSameOrBefore('1900-01-01') ? '' : vencto02.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto03.isSameOrBefore('1900-01-01') ? '' : vencto03.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto04.isSameOrBefore('1900-01-01') ? '' : vencto04.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: `${vencto05.isSameOrBefore('1900-01-01') ? '' : vencto05.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto06.isSameOrBefore('1900-01-01') ? '' : vencto06.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto07.isSameOrBefore('1900-01-01') ? '' : vencto07.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto08.isSameOrBefore('1900-01-01') ? '' : vencto08.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: `${vencto09.isSameOrBefore('1900-01-01') ? '' : vencto09.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto10.isSameOrBefore('1900-01-01') ? '' : vencto10.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto11.isSameOrBefore('1900-01-01') ? '' : vencto11.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto12.isSameOrBefore('1900-01-01') ? '' : vencto12.format('DD/MM/YYYY')}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
										{text: utils.number.float2moeda(model['CONHECIMENTOS_BASEICMS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor do ICMS\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_VALORICMS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Base de Cálculo ST\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_BASEST']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor ICMS ST\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_VALORST']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor FPC\n`, alignment: 'center', style: {fontSize: 6}},
										{text: '', alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Valor Produtos\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_PRODUTOS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}]
							);

							rows.push(
								[{
									colSpan: 6,
									text: [
										{text: `Valor do Frete\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_FRETE']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor do Seguro\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_SEGURO']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor Despesas\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_DESPESAS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor do IPI\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_VALORIPI']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor Tributos - IBPT\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_IMPOSTO']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Valor Total\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['CONHECIMENTOS_TOTAL']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}],
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
									colSpan: 15,
									text: [
										{text: `Nome/Razão Social\n`, alignment: 'left', style: {fontSize: 6}},
										{text: transporte['CONHECIMENTOSENVIO_NOME'] || ' ', alignment: 'left', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 4,
									text: [
										{
											text: `Frete por Conta\n1 = Emitente\n2 = Destinatário`,
											alignment: 'left',
											style: {fontSize: 5}										
										}
									],
									border: [true, true, false, true]
								},{},{},{},{
									text: [
										{
											text: 'a\n', color: 'white', style: {fontSize: 4},
										},
										{
											text: (transporte['CONHECIMENTOSENVIO_MODO'] == 'C' ? '1' : '2'),
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
										{text: transporte['CONHECIMENTOSENVIO_PLACA'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},
								{
									colSpan: 2,
									text: [
										{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: transporte['CONHECIMENTOSENVIO_PLACAUF'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},
								{
									colSpan: 6,
									text: [
										{text: `CPF/CNPJ\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.string.maskCnp(transporte['CONHECIMENTOSENVIO_CPFCNPJ']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}]
							);

							rows.push(
								[{
									colSpan: 15,
									text: [
										{text: `Endereço\n`, alignment: 'left', style: {fontSize: 6}},
										{text: `${transporte['CONHECIMENTOSENVIO_ENDERECO']} ${transporte['CONHECIMENTOSENVIO_NUMERO']} `, alignment: 'left', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 9,
									text: [
										{text: `Município\n`, alignment: 'left', style: {fontSize: 6}},
										{text: transporte['CIDADES_NOME'], alignment: 'left', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},
								{
									colSpan: 2,
									text: [
										{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: transporte['CIDADES_ESTADO'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},
								{
									colSpan: 6,
									text: [
										{text: `Inscrição Estadual\n`, alignment: 'center', style: {fontSize: 6}},
										{text: transporte['CONHECIMENTOSENVIO_INSCRICAO'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}]
							);					
							rows.push(
								[{
									colSpan: 5,
									text: [
										{text: `Quantidade\n`, alignment: 'center', style: {fontSize: 6}},
										{text: transporte['CONHECIMENTOSENVIO_QUANTIDADE'] || ' ', alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Espécie\n`, alignment: 'center', style: {fontSize: 6}},
										{text: transporte['CONHECIMENTOSENVIO_ESPECIE'], alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Marca\n`, alignment: 'center', style: {fontSize: 6}},
										{text: transporte['CONHECIMENTOSENVIO_MARCA'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Volumes\n`, alignment: 'center', style: {fontSize: 6}},
										{text: transporte['CONHECIMENTOSENVIO_VOLUMES'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Peso Bruto\n`, alignment: 'center', style: {fontSize: 6}},
										{text: transporte['CONHECIMENTOSENVIO_PESOBRUTO'] || '', alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Peso Líquido\n`, alignment: 'center', style: {fontSize: 6}},
										{text: transporte['CONHECIMENTOSENVIO_PESOLIQUIDO'] || '', alignment: 'center', style: {fontSize: 8, bold: true}},
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
								{
									text: 'Código',	alignment: 'center', style: {fontSize: 6, bold: true}
								},
								{
									text: 'Descrição dos Produtos',	alignment: 'left', style: {fontSize: 6, bold: true},
									colSpan: 10
								}, 
								{},{},{},{},{},{},{},{},{},
								{
									colSpan: 3,
									text: 'NCM/SH',
									alignment: 'center', style: {fontSize: 6, bold: true}		
								},{},{},
								{
									text: 'Cfop',
									style: {fontSize: 5, bold: true}
								},
								{
									text: 'Cst',
									style: {fontSize: 5, bold: true}
								},
								{
									colSpan: 2,
									text: 'Qtde',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},
								{
									text: 'Un',
									alignment: 'center', style: {fontSize: 5, bold: true}
								},
								{
									colSpan: 2,
									text: 'Preço',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},
								{
									colSpan: 3,
									text: 'Vlr. Total',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},{},
								{
									colSpan: 2,
									text: 'Base Icms',
									style: {fontSize: 5, bold: true}
								},{},
								{
									colSpan: 2,
									text: 'Vlr. Icms',
									style: {fontSize: 5, bold: true}
								},{},
								{
									colSpan: 2,
									text: 'Vlr. Ipi',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},
								{
									text: 'Icms',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},
								{
									text: 'Ipi',
									alignment: 'center', style: {fontSize: 6, bold: true}
								}
							]
							);
						}

						rows.push(
							[
								{
									text: produtos[i]['CONHECIMENTOSITENS_ID_PRODUTOS'],	alignment: 'center', style: {fontSize: 6}
								},
								{
									text: produtos[i]['PRODUTOS_NOME'].substring(0, 45), alignment: 'left', style: {fontSize: 6},
									colSpan: 10
								}, 
								{},{},{},{},{},{},{},{},{},
								{
									colSpan: 3,
									text: produtos[i]['NCMS_NCM'],
									alignment: 'center', style: {fontSize: 6}		
								},{},{},
								{
									text: (produtos[i]['CONHECIMENTOSITENS_ID_OPERACOES'] / 100),
									style: {fontSize: 5}
								},
								{
									text: produtos[i]['CONHECIMENTOSITENS_CST'],
									alignment: 'center', style: {fontSize: 5}
								},
								{
									colSpan: 2,
									text: produtos[i]['CONHECIMENTOSITENS_QUANTIDADE'],
									alignment: 'right', style: {fontSize: 6}
								},{},
								{
									text: produtos[i]['PRODUTOS_UNIDADE'],
									alignment: 'center', style: {fontSize: 6}
								},
								{
									colSpan: 2,
									text: utils.number.float2moeda(produtos[i]['CONHECIMENTOSITENS_PRECO']),
									alignment: 'right', style: {fontSize: 6}
								},{},
								{
									colSpan: 3,
									text: utils.number.float2moeda(produtos[i]['CONHECIMENTOSITENS_TOTAL']),
									alignment: 'right', style: {fontSize: 6}
								},{},{},
								{
									colSpan: 2,
									text: utils.number.float2moeda(produtos[i]['CONHECIMENTOSITENS_BASEICMS']) || '',
									alignment: 'right',
									style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: utils.number.float2moeda(produtos[i]['CONHECIMENTOSITENS_VALORICMS']) || '',
									alignment: 'right', style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: utils.number.float2moeda(produtos[i]['CONHECIMENTOSITENS_VALORIPI']) || '',
									alignment: 'right', style: {fontSize: 6}
								},{},
								{
									text: produtos[i]['CONHECIMENTOSITENS_ICMS'] || '',
									alignment: 'right', style: {fontSize: 6}
								},
								{
									text: produtos[i]['CONHECIMENTOSITENS_IPI'] || '',
									alignment: 'right', style: {fontSize: 6}
								}
		
							]
						)
						itensPagina++
					}


					for (linhas = itensPagina; linhas < 18; linhas++) {  // Aqui completamos a grid com linhas em branco
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
										text: `Informações: ${(model['EMPRESAS_SIMPLES'] == 'T' ?
										'Empresa optante do simples nacional, não gera crédito de ICMS/IPI' : '')}\n`,
										style: {fontSize: 7}
									},
									{ 
										text: `${obsNfe}`,
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