'use strict';

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
    readById: async (id, params) => { 
        try {
		
			const queryMovimentos = await api.movimentos().readById(id, params)
			const model = queryMovimentos.results[0];
            const listaConvenios = params.convenio;

			let empresaUf = model['CIDADES_ESTADOEMPRESA'];
			let pessoaCnpj = '';
			let pessoaIe = '';
			let pessoaNome = '';
			let pessoaEnd = '';
			let pessoaNum = '';
			let pessoaBai = '';
			let pessoaCep = '';
			let pessoaMun = '';
			let pessoaUf = '';
			let pessoaFon = '';

			if(model['MOVIMENTOS_ID_PROPRIEDADES'] > 0) {
				pessoaCnpj = model['PROPRIEDADES_CPFCNPJ'];
				pessoaIe   = model['PROPRIEDADES_INSCRICAO'];
				pessoaNome = model['PROPRIEDADES_NOME'];
				pessoaEnd  = model['PROPRIEDADES_ENDERECO'];
				pessoaNum  = model['PROPRIEDADES_NUMERO'];;
				pessoaBai  = model['PROPRIEDADES_BAIRRO'];
				pessoaCep  = model['PROPRIEDADES_CEP'];
				pessoaMun  = model['CIDADES_NOMEPROPRIEDADE'];
				pessoaUf   = model['CIDADES_ESTADOPROPRIEDADE'];
				pessoaFon  = model['PROPRIEDADES_TELEFONE'];
			} else {
				pessoaCnpj = model['PESSOAS_CPFCNPJ'];
				pessoaIe   = model['PESSOAS_INSCRICAO'];
				pessoaNome = model['PESSOAS_NOME'];
				pessoaEnd  = model['PESSOAS_ENDERECO'];
				pessoaNum  = model['PESSOAS_NUMERO'];;
				pessoaBai  = model['PESSOAS_BAIRRO'];
				pessoaCep  = model['PESSOAS_CEP'];
				pessoaMun  = model['CIDADES_NOME'];
				pessoaUf   = model['CIDADES_ESTADO'];
				pessoaFon  = model['PESSOAS_TELEFONE'];
			}

            const isLocal = pessoaUf == empresaUf; // Determina qual convênio listar
			const isRegiao12 = model['EMPRESAS_REGIAO12'].indexOf(pessoaUf) > 0;

			let arrayConvenios = []; // Aqui irá a lista de convenios.
			let linhasConvenios = []; // Aqui é o que será impresso.

			const motivoNfe = model['MOVIMENTOS_PROTOCOLO'] == ''  ? `Nf-e sem Protocolo/Cód Barras - Sem valor fiscal` :
			                  model['MOVIMENTOS_STATUS']    == 'C' ? `Nf-e CANCELADA - Por motivo de emissão indevida` :
			                  model['MOVIMENTOS_STATUS']    == 'D' ? `............Nf-e DENEGADA pela SEFAZ...........` :
							  model['MOVIMENTOS_STATUS']    == 'R' ? `.........NF-e RECUSADA pelo Destinatário.......` : ''

			const docDefinition = {
				pageOrientation: 'portrait', 
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 20],
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
								</text></svg>`
					} : {
						image: `${appRoot}/resources/images/marcasdagua/corteva.png`,
						width: 400,
						absolutePosition: {x: 100, y: 480},
						opacity: 0.2
					}
				],									
				content: [
					{
						style: 'tableReport', // antes (Tam)                                                      10  10
						table: { // Colunas (32)   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32 
							widths: [ 18,  5,  5,  7,  7,  7,  7,  7,  6,  6,  6,  4,  4,  4, 12, 12,  6,  8, 10, 28, 24,  8,  8,  8,  8,  8,  6,  6,  6,  6, 12, 12],
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
								
			const isComplementar = model['OPERACOES_COMPLEMENTAR'] == 'T';	
			
			let msgIRRF = '';

			if(cents(model['MOVIMENTOS_VALORRETENCAO']) > 0) {
				msgIRRF = `IRRF retido conf. IN RFB nº 1.234/2012, arts. 2º-A e 3º-A.\nBase: R$ ${utils.number.float2moeda(model['MOVIMENTOS_TOTAL'])} - Alíquota: ${utils.number.float2moeda(model['PESSOAS_RETENCAO'])}% - IRRF: R$ ${utils.number.float2moeda(model['MOVIMENTOS_VALORRETENCAO'])}.\nValor líquido a pagar: R$ ${utils.number.float2moeda((cents(model['MOVIMENTOS_TOTAL']) - cents(model['MOVIMENTOS_VALORRETENCAO']))/100)}.`;
			}

			let linesObs = msgIRRF ? 3 : 6;
		
	   		let obsNfe      = model['MOVIMENTOS_OBSERVACOES'] ? model['MOVIMENTOS_OBSERVACOES'].split('|').slice(0, linesObs).join('\n') : ('\n').repeat(linesObs);
			const emiNfe = moment(model['MOVIMENTOS_EMISSAO']);
			const saiNfe = moment(model['MOVIMENTOS_ENTRADASAIDA']);
			const produtos = model['MOVIMENTOS_ITENS'];
			const transporte  = model['MOVIMENTOS_ENVIO'][0] || [];
			const barcodes  = (codes.create('code128', model['MOVIMENTOS_NFE']) || '').toString('base64');
			const empCelular = utils.string.maskFone(model['EMPRESAS_CELULAR']);
			const semFrete = (transporte['MOVIMENTOSENVIO_MODO'] == 'S' || isComplementar);
			
			let pagina = 1;				
			let itensPagina = 0;
			let qtdProdutos = produtos.length;
			let qtdLotes = produtos.filter(produto => produto['LOTES_REFERENCIA'] != '').length;

			const paginas = ((qtdProdutos + qtdLotes) <= 14 ? 1 : Math.trunc(produtos.length / 14) + ((produtos.length % 14) > 0 ? 1: 0));
			
			let pathLogo;

			try {
				pathLogo = utils.client.getImagePath(`logos/nfe/${model['EMPRESAS_CPFCNPJ']}.png`, params);
			} catch(error) {
				pathLogo = `${appRoot}/resources/images/nfe/default.png`;
			}

			const caixa           = model['MOVIMENTOS_CAIXA'] || [];
			let condPagto         = formaPagamento(model);
			const valorFinanceiro = caixa.length > 0 ? caixa[0]['MOVIMENTOSCAIXA_DUPLICATA'] : 0;
			const financeiros = valorFinanceiro > 0 ? (model['MOVIMENTOS_FINANCEIROS'] || []) : [];

			let valorProdutos = isComplementar ? '\n' : utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS']);
			let valorNfe      = isComplementar ? '\n' : utils.number.float2moeda(model['MOVIMENTOS_TOTAL']);

			const fatura01 = (financeiros.length > 0  ? `${model['MOVIMENTOS_NUMERO']}/01` : '');
			const fatura02 = (financeiros.length > 1  ? `${model['MOVIMENTOS_NUMERO']}/02` : '');
			const fatura03 = (financeiros.length > 2  ? `${model['MOVIMENTOS_NUMERO']}/03` : '');
			const fatura04 = (financeiros.length > 3  ? `${model['MOVIMENTOS_NUMERO']}/04` : '');
			const fatura05 = (financeiros.length > 4  ? `${model['MOVIMENTOS_NUMERO']}/05` : '');
			const fatura06 = (financeiros.length > 5  ? `${model['MOVIMENTOS_NUMERO']}/06` : '');
			const fatura07 = (financeiros.length > 6  ? `${model['MOVIMENTOS_NUMERO']}/07` : '');
			const fatura08 = (financeiros.length > 7  ? `${model['MOVIMENTOS_NUMERO']}/08` : '');
			const fatura09 = (financeiros.length > 8  ? `${model['MOVIMENTOS_NUMERO']}/09` : '');
			const fatura10 = (financeiros.length > 9  ? `${model['MOVIMENTOS_NUMERO']}/10` : '');
			const fatura11 = (financeiros.length > 10 ? `${model['MOVIMENTOS_NUMERO']}/11` : '');
			const fatura12 = (financeiros.length > 11 ? `${model['MOVIMENTOS_NUMERO']}/12` : '');

			const vencto01 = (financeiros.length > 0  ? moment(financeiros[0]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto02 = (financeiros.length > 1  ? moment(financeiros[1]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto03 = (financeiros.length > 2  ? moment(financeiros[2]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto04 = (financeiros.length > 3  ? moment(financeiros[3]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto05 = (financeiros.length > 4  ? moment(financeiros[4]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto06 = (financeiros.length > 5  ? moment(financeiros[5]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto07 = (financeiros.length > 6  ? moment(financeiros[6]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto08 = (financeiros.length > 7  ? moment(financeiros[7]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto09 = (financeiros.length > 8  ? moment(financeiros[8]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'): '');
			const vencto10 = (financeiros.length > 9  ? moment(financeiros[9]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto11 = (financeiros.length > 10 ? moment(financeiros[10]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto12 = (financeiros.length > 11 ? moment(financeiros[11]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');

			const valor01 = (financeiros.length > 0  ? utils.number.float2moeda(financeiros[0]['FINANCEIROS_ORIGINAL']) : '');
			const valor02 = (financeiros.length > 1  ? utils.number.float2moeda(financeiros[1]['FINANCEIROS_ORIGINAL']) : '');
			const valor03 = (financeiros.length > 2  ? utils.number.float2moeda(financeiros[2]['FINANCEIROS_ORIGINAL']) : '');
			const valor04 = (financeiros.length > 3  ? utils.number.float2moeda(financeiros[3]['FINANCEIROS_ORIGINAL']) : '');
			const valor05 = (financeiros.length > 4  ? utils.number.float2moeda(financeiros[4]['FINANCEIROS_ORIGINAL']) : '');
			const valor06 = (financeiros.length > 5  ? utils.number.float2moeda(financeiros[5]['FINANCEIROS_ORIGINAL']) : '');
			const valor07 = (financeiros.length > 6  ? utils.number.float2moeda(financeiros[6]['FINANCEIROS_ORIGINAL']) : '');
			const valor08 = (financeiros.length > 7  ? utils.number.float2moeda(financeiros[7]['FINANCEIROS_ORIGINAL']) : '');
			const valor09 = (financeiros.length > 8  ? utils.number.float2moeda(financeiros[8]['FINANCEIROS_ORIGINAL']) : '');
			const valor10 = (financeiros.length > 9  ? utils.number.float2moeda(financeiros[9]['FINANCEIROS_ORIGINAL']) : '');
			const valor11 = (financeiros.length > 10 ? utils.number.float2moeda(financeiros[10]['FINANCEIROS_ORIGINAL']) : '');
			const valor12 = (financeiros.length > 11 ? utils.number.float2moeda(financeiros[11]['FINANCEIROS_ORIGINAL']) : '');
			
			for(let i in produtos){
				if(itensPagina > 13 || itensPagina == 0) { // Se primeiro passo do laço ou se já imprimiu uma página
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
											text: `Informações Complementares: \n`,
											style: {fontSize: 7}
										},
										{ 
											text: model['OPERACOES_ACAO'] == 'AI' ? '\n' : `Vendedor: ${model['MOVIMENTOS_ID_USUARIOS']} - ${model['USUARIOS_NOME'].split(' ')[0]} ${condPagto ? ('Condição: ' + condPagto) : ''}\n `,
											style: {fontSize: 7}
										},
										{ 
											text: model['OPERACOES_ACAO'] == 'AI' ? '\n' : `Conf. Lei Nr 9074 Inf. End. de Devolução de Emb. Vazias de Defensivos Agrícolas Uni. Central de BILAC/SP-(18) 3659-2604 Av. Ind. Antonio Serafin 1501 Jd Planal`,
											style: {fontSize: 7}
										},
										{ 
											text: `${msgIRRF}${obsNfe}`,
											style: {fontSize: 8}
										},
										{ 
											text: parseInt(model['MOVIMENTOS_NUMEROORIGEM'] || '') > 0 ? `Pedido: ${model['MOVIMENTOS_NUMEROORIGEM']}` : '',
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
										style: {bold: true,	fontSize: 7}
									},
									{
										text: `${model['EMPRESAS_BAIRRO']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: `Cep: ${utils.string.maskCep(model['EMPRESAS_CEP'])} - ${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: `Fone: ${utils.string.maskFone(model['EMPRESAS_TELEFONE'])}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: (empCelular ? `Celular: ${empCelular}\n` : ''),
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: `${model['EMPRESAS_EMAIL']}`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
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
								{text: `${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ'])}`, alignment: 'center', style: {fontSize: 6, bold: true}}
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
								{text: `${pessoaNome} (${model['MOVIMENTOS_ID_PESSOAS']})`, alignment: 'left', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 7,
							text: [
								{text: `CNPJ/CPF\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${utils.string.maskCnp(pessoaCnpj)}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
								{text: `${pessoaEnd}`, alignment: 'left', style: {fontSize: (pessoaEnd.length > 40 ? 7 : 8), bold: true}}
							]
						},{},{},{},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 3,
							text: [
								{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${pessoaNum}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},{},						
						{
							colSpan: 6,
							text: [
								{text: `Bairro\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${pessoaBai}`, alignment: 'center', style: {fontSize: (pessoaBai.length > 20 ? 5 : 8), bold: true}}
							]
						},{},{},{},{},{},
						{
							colSpan: 4,
							text: [
								{text: `CEP\n`, alignment: 'left', style: {fontSize: 6}},
								{text: `${utils.string.maskCep(pessoaCep)}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
								{text: `${pessoaMun}`, alignment: 'left', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 5,
							text: [
								{text: `Telefone\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${utils.string.maskFone(pessoaFon)}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},
						{
							colSpan: 2,
							text: [
								{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${pessoaUf}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},
						{
							colSpan: 7,
							text: [
								{text: `Inscrição Estadual\n`, alignment: 'left', style: {fontSize: 6}},
								{text: `${pessoaIe}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},{},{},
						{
							colSpan: 6,
							text: [
								{text: `Hora de Saída\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${model['MOVIMENTOS_HORA']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
								{text: `${fatura01}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura02}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura03}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura04}\n`, alignment: 'center', style: {fontSize: 6, bold: true}}
							]
						},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${vencto01}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto02}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto03}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto04}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${valor01}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor02}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor03}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor04}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},{},
						{
							colSpan: 3,
							text: [
								{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${fatura05}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura06}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura07}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura08}\n`, alignment: 'center', style: {fontSize: 6, bold: true}}

							]
						},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${vencto05}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto06}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto07}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto08}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},{},
						{
							colSpan: 3,
							text: [
								{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${valor05}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor06}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor07}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor08}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},
						{
							colSpan: 3,
							text: [
								{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${fatura09}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura10}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura11}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura12}\n`, alignment: 'center', style: {fontSize: 6, bold: true}}
							]
						},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${vencto09}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto10}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto11}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto12}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${valor09}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor10}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor11}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor12}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
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
								{text: '', alignment: 'center', style: {fontSize: 8, bold: true}},
								{text: utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']), alignment: 'center', style: {fontSize: 8, bold: true}},
							]
						},{},{},{},{},
						{
							colSpan: 6,
							text: [
								{text: `Valor Produtos\n`, alignment: 'center', style: {fontSize: 6}},
								{text: valorProdutos, alignment: 'center', style: {fontSize: 8, bold: true}},
							]
						},{},{},{},{},{}]
					);

					rows.push(
						[{
							colSpan: 6,
							text: [
								{text: `Valor do Frete\n`, alignment: 'center', style: {fontSize: 6}},
								{text: utils.number.float2moeda(model['MOVIMENTOS_FRETE']), alignment: 'center', style: {fontSize: 8, bold: true}},
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
								{text: valorNfe, alignment: 'center', style: {fontSize: 8, bold: true}},
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
								{text: isComplementar ? '' : (transporte['MOVIMENTOSENVIO_NOME'] || ' ').slice(0, 40), alignment: 'left', style: {fontSize: 8, bold: true}},
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
									text: (transporte['MOVIMENTOSENVIO_MODO'] == 'C' ? '1' : 
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
								{text: (semFrete ? '' : transporte['CIDADES_NOME']), alignment: 'left', style: {fontSize: 8, bold: true}}
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
						[
							{
								colSpan: 5,
								text: [
									{text: `Quantidade\n`, alignment: 'center', style: {fontSize: 6}},
									{text: (transporte['MOVIMENTOSENVIO_QUANTIDADE'] || ' '), alignment: 'center', style: {fontSize: 8, bold: true}},
								]
							},{},{},{},{},
							{
								colSpan: 6,
								text: [
									{text: `Espécie\n`, alignment: 'center', style: {fontSize: 6}},
									{text: transporte['MOVIMENTOSENVIO_ESPECIE'], alignment: 'center', style: {fontSize: 8, bold: true}}
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
							{   // Coluna 1 (Código)
								text: 'Cód',	alignment: 'center', style: {fontSize: 6, bold: true}
							},
							{
								text: 'Descrição dos Produtos',	alignment: 'left', style: {fontSize: 6, bold: true},
								colSpan: 10
							}, // Colunas 2 a 11 (Descrição)
							{},{},{},{},{},{},{},{},{},
							{  // Colunas 12 a 14 (NCM)
								colSpan: 3,
								text: 'NCM/SH',
								alignment: 'center', style: {fontSize: 6, bold: true}		
							},{},{},
							{   // Coluna 15 (CFOP)
								text: 'Cfop',
								style: {fontSize: 5, bold: true}
							},
							{   // Coluna 16 (CST)
								text: 'Cst',
								style: {fontSize: 5, bold: true}
							},
							{   // Coluna 17 e 18 (Qtde)
								colSpan: 2,
								text: 'Qtde',
								alignment: 'center', style: {fontSize: 6, bold: true}
							},{},
							{   // Coluna 19 (UN)
								text: 'Un',
								alignment: 'center', style: {fontSize: 5, bold: true}
							},
							{   // Coluna 20 (Preço)
								text: 'Preço',
								alignment: 'center', style: {fontSize: 6, bold: true}
							},{ // Coluna 21 (Desconto)
								text: 'Desconto',
								alignment: 'center', style: {fontSize: 5, bold: true}
							},
							{   // Coluna 22 a 24 (Total)
								colSpan: 3,
								text: 'Vlr. Total',
								alignment: 'center', style: {fontSize: 6, bold: true}
							},{},{},
							{   // Coluna 25 e 26 (Base ICMS)
								colSpan: 2,
								text: 'Base Icms',
								style: {fontSize: 5, bold: true}
							},{},
							{   // Coluna 27 e 28 (Valor ICMS)
								colSpan: 2,
								text: 'Vlr. Icms',
								style: {fontSize: 5, bold: true}
							},{},
							{   // Coluna 29 e 30 (Vlr Ipi)
								colSpan: 2,
								text: 'Vlr. Ipi',
								alignment: 'center', style: {fontSize: 6, bold: true}
							},{},
							{   // Coluna 31 (Valor Icms)
								text: 'Icms',
								alignment: 'center', style: {fontSize: 5, bold: true}
							},
							{   // Coluna 32
								text: 'Ipi',
								alignment: 'center', style: {fontSize: 6, bold: true}
							}
						]
					);
				}

				const precoUnitario = (
					produtos[i]['MOVIMENTOSITENS_PRECO'].toString().length <= produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).length ?
				    utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']) :
					produtos[i]['MOVIMENTOSITENS_PRECO'].toString().replace('.', ',')
				);

				const descontoUnitario = (
					produtos[i]['MOVIMENTOSITENS_DESCONTOS'].toString().length <= produtos[i]['MOVIMENTOSITENS_DESCONTOS'].toFixed(2).length ?
					utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_DESCONTOS']) :
									     produtos[i]['MOVIMENTOSITENS_DESCONTOS'].toString().replace('.', ','))


				const letraLocal  = ((produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'] == 4266 ||
				                     produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'] == 5839) && pessoaUf == 'SP' && model['PESSOAS_CATEGORIA'] == '4') ?
									 'Z' : 
									 (produtos[i]['SALDOS_LOCAL'].match(/|/) ? produtos[i]['SALDOS_LOCAL'].split('|')[0] : '');

				const letraOutros = produtos[i]['SALDOS_LOCAL'].match(/|/) ? produtos[i]['SALDOS_LOCAL'].split('|')[1] : ''
				const letraReg12  = produtos[i]['SALDOS_LOCAL'].match(/|/) ? produtos[i]['SALDOS_LOCAL'].split('|')[2] : ''
			    const letraConvenio = isLocal ? letraLocal : 
				                      isRegiao12 ? letraReg12 :
									  letraOutros;

				const itemTributado = (produtos[i]['MOVIMENTOSITENS_CST'] == '000');
				const nomeTam = (produtos[i]['PRODUTOS_NOME'] || '').trim().length;

				if(!itemTributado) {
					if(arrayConvenios.indexOf(letraConvenio) == -1) {
						arrayConvenios.push(letraConvenio);
					}	
				}

				rows.push(
					[
						{
							text: isComplementar ? `CFO${parseInt(produtos[i]['MOVIMENTOSITENS_ID_OPERACOES'] / 100).toString()}` : produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],	alignment: 'center', style: {fontSize: (isComplementar ? 4 : 6)}
						},
						{
							text: produtos[i]['PRODUTOS_NOME'].substring(0, 44) + ((letraConvenio && letraConvenio != 'N' && !itemTributado) ? '*' + letraConvenio : ''), alignment: 'left', style: {fontSize: nomeTam > 36 ? 5 : 6},
							colSpan: 10
						}, 
						{},{},{},{},{},{},{},{},{},
						{
							colSpan: 3,
							text: produtos[i]['NCMS_NCM'],
							alignment: 'center', style: {fontSize: 6}		
						},{},{},
						{
							text: parseInt(produtos[i]['MOVIMENTOSITENS_ID_OPERACOES'] / 100),
							style: {fontSize: 5}
						},
						{
							text: produtos[i]['MOVIMENTOSITENS_CST'],
							alignment: 'center', style: {fontSize: 5}
						},
						{
							colSpan: 2,
							text: isComplementar ? '0,00' :	produtos[i]['MOVIMENTOSITENS_QUANTIDADE'],
							alignment: 'right', style: {fontSize: 6}
						},{},
						{
							text: isComplementar ? '' :	produtos[i]['PRODUTOS_UNIDADE'].slice(0, 2),
							alignment: 'center', style: {fontSize: 6}
						},
						{
							text: isComplementar ? '0,00' :	precoUnitario,
							alignment: 'right', style: {fontSize: 6}
						},
						{
							text: isComplementar ? '0,00' :	descontoUnitario,
							alignment: 'right', style: {fontSize: 5}
						},
						{
							colSpan: 3,
							text: isComplementar ? '0,00' :	utils.number.float2moeda(produtos[i]['TOTAL_LIQUIDO']),
							alignment: 'right', style: {fontSize: 6}
						},{},{},
						{
							colSpan: 2,
							text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_BASEICMS']) || '',
							alignment: 'right',
							style: {fontSize: 5}
						},{},
						{
							colSpan: 2,
							text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_VALORICMS']) || '',
							alignment: 'right', style: {fontSize: 5}
						},{},
						{
							colSpan: 2,
							text: isComplementar ? '' :	utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_VALORIPI']) || '',
							alignment: 'right', style: {fontSize: 6}
						},{},
						{
							text: isComplementar ? '' :	produtos[i]['MOVIMENTOSITENS_ICMS'] || '',
							alignment: 'right', style: {fontSize: 6}
						},
						{
							text: isComplementar ? '' :	produtos[i]['MOVIMENTOSITENS_IPI'] || '',
							alignment: 'right', style: {fontSize: 6}
						}

					]
				)

				itensPagina++

				if(produtos[i]['LOTES_REFERENCIA'] != '') { // Se tiver lote
					const numLot = produtos[i]['LOTES_REFERENCIA'];
					const fabLot = moment(produtos[i]['LOTES_FABRICACAO']);
					const valLot = moment(produtos[i]['LOTES_VALIDADE']);
					
					rows.push([
						{ text: 'A', style: {color: 'white', fontSize: 6}},
						{
							colSpan: 10,									
							svg: `<svg><text
							transform="translate(0, 5) rotate(0)"
							fill= "black"
							style="font-size: 6px;"
							>
							Fab.: ${fabLot.isSameOrBefore('1900-01-01') ? '' : fabLot.format('DD/MM/YYYY')} Val.: ${valLot.isSameOrBefore('1900-01-01') ? '' : valLot.format('DD/MM/YYYY')} Lote: ${numLot}
							</text></svg>`
						},{},{},{},{},{},{},{},{},{},
						{ text: '',	colSpan: 3 },{},{},
						{ text: '' },
						{ text: '' },
						{ text: '',	colSpan: 2 },{},									
						{ text: '' },
						{ text: '' },
						{ text: '' },
						{ text: '',	colSpan: 3 },{},{},
						{ text: '',	colSpan: 2 },{},
						{ text: '',	colSpan: 2 },{},																		
						{ text: '',	colSpan: 2 },{},
						{ text: '' },
						{ text: '' }			
					])
					itensPagina++							
				}
			}

			for(let i in arrayConvenios) {
				const letra = arrayConvenios[i];
				for(let l in listaConvenios) {
					if(listaConvenios[l][0] == letra) {
						if(letra != 'N') {
							linhasConvenios.push(letra + '-' + listaConvenios[l][1]);
						}
					}
				}
			}

			if(linhasConvenios.length > 0 && !isComplementar){  // Se tem convenios pra imprimir e não é nota complementar
				rows.push(  // Pula uma linha antes de começar.
					[
						{
							text: ' ', style: {fontSize: 6}  // 1
						},
						{
							colSpan: 10,									
							text: ' ', style: {fontSize: 6}, // 2-11
						}, 
						{},{},{},{},{},{},{},{},{},
						{
							colSpan: 3,
							text: ' ', style: {fontSize: 6} // 12-14
						},{},{},
						{
							text: ' ', style: {fontSize: 5} // 15
						},
						{
							text: ' ', style: {fontSize: 5}  // 16
						},
						{
							colSpan: 2,
							text: ' ', style: {fontSize: 6}  // 17-18
						},{},
						{
							text: ' ', style: {fontSize: 6}  // 19
						},
						{
							text: ' ', style: {fontSize: 6}  // 20
						},
						{
							text: ' ', style: {fontSize: 6}  // 21
						},
						{
							colSpan: 3,
							text: ' ', style: {fontSize: 6} // 20-22
						},{},{},
						{
							colSpan: 2,
							text: ' ', style: {fontSize: 5} // 
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
				);
				itensPagina++
				for(let c in linhasConvenios) {
					rows.push(
						[
							{
								text: linhasConvenios[c].split('-')[0], style: {fontSize: 6, alignment: 'center'}  // 1
							},
							{
								colSpan: 10,									
								svg: `<svg><text
								transform="translate(0, 5) rotate(0)"
								fill= "black"
								style="font-size: 6px;"
								>
								${linhasConvenios[c].split('-')[1]}
								</text></svg>`

							}, 
							{},{},{},{},{},{},{},{},{},
							{
								colSpan: 3,
								text: ' ', style: {fontSize: 6} // 12-14
							},{},{},
							{
								text: ' ', style: {fontSize: 5} // 15
							},
							{
								text: ' ', style: {fontSize: 5}  // 16
							},
							{
								colSpan: 2,
								text: ' ', style: {fontSize: 6}  // 17-18
							},{},
							{
								text: ' ', style: {fontSize: 6}  // 19
							},
							{
								text: ' ', style: {fontSize: 6}  // 20
							},
							{
								text: ' ', style: {fontSize: 6}  // 21
							},
							{
								colSpan: 3,
								text: ' ', style: {fontSize: 6} // 20-22
							},{},{},
							{
								colSpan: 2,
								text: ' ', style: {fontSize: 5} // 
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
					);
					itensPagina++					
				}
			}

			for (let linhas = itensPagina; linhas < 14; linhas++) {  // Aqui completamos a grid com linhas em branco
				rows.push(
					[
						{
							text: ' ', style: {fontSize: 6}  // 1
						},
						{
							colSpan: 10,									
							text: ' ', style: {fontSize: 6}, // 2-11
						}, 
						{},{},{},{},{},{},{},{},{},
						{
							colSpan: 3,
							text: ' ', style: {fontSize: 6} // 12-14
						},{},{},
						{
							text: ' ', style: {fontSize: 5} // 15
						},
						{
							text: ' ', style: {fontSize: 5}  // 16
						},
						{
							colSpan: 2,
							text: ' ', style: {fontSize: 6}  // 17-18
						},{},
						{
							text: ' ', style: {fontSize: 6}  // 19
						},
						{
							text: ' ', style: {fontSize: 6}  // 20
						},
						{
							text: ' ', style: {fontSize: 6}  // 21
						},
						{
							colSpan: 3,
							text: ' ', style: {fontSize: 6} // 20-22
						},{},{},
						{
							colSpan: 2,
							text: ' ', style: {fontSize: 5} // 
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
								text: `Informações Complementares: \n`,
								style: {fontSize: 7}
							},
							{ 
								text: model['OPERACOES_ACAO'] == 'AI' ? '\n' : `Vendedor: ${model['MOVIMENTOS_ID_USUARIOS']} - ${model['USUARIOS_NOME'].split(' ')[0]} ${condPagto ? ('Condição: ' + condPagto) : ''}\n `,
								style: {fontSize: 7}
							},
							{ 
								text: model['OPERACOES_ACAO'] == 'AI' ? '\n' : `Conf. Lei Nr 9074 Inf. End. de Devolução de Emb. Vazias de Defensivos Agrícolas Uni. Central de BILAC/SP-(18) 3659-2604 Av. Ind. Antonio Serafin 1501 Jd Planal`,
								style: {fontSize: 7}
							},
							{ 
								text: `${msgIRRF}${obsNfe}`,
								style: {fontSize: 8}
							},
							{ 
								text: parseInt(model['MOVIMENTOS_NUMEROORIGEM'] || '') > 0 ? `Pedido: ${model['MOVIMENTOS_NUMEROORIGEM']}` : '',
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
			const msg = 'Falha ao gerar danfe';
			console.log(msg);
			console.log(error);
			throw { msg, error };
		}
    }
};

const formaPagamento = function(model) {
	let formas = '';
	let caixa  = model['MOVIMENTOS_CAIXA'] || [];
	
	if(caixa.length > 0) {
		for (let i in caixa) {
			if(caixa[i]['MOVIMENTOSCAIXA_DINHEIRO'] > 0) {
				formas += 'DINHEIRO/';
			}		
			if(caixa[i]['MOVIMENTOSCAIXA_TRANSFERENCIAS'] > 0) {
				formas += 'TRANSFERENCIA BANCARIA/';
			}		
			if(caixa[i]['MOVIMENTOSCAIXA_CHEQUE'] > 0) {
				formas += 'CHEQUE/';
			}
			if((caixa[i]['MOVIMENTOSCAIXA_CREDITO'] + caixa[i]['MOVIMENTOSCAIXA_DEBITO']) > 0) {
				formas += 'CARTAO/';
			}
			if(caixa[i]['MOVIMENTOSCAIXA_OUTRO'] > 0) {
				formas += 'FINANCEIRA/';
			}
		}	
	} else {
		formas = ' ';
	}

	return formas.substr(0, (formas.length - 1));
};