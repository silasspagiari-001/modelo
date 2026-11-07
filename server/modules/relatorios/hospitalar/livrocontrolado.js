'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const MesExtenso = [
	"INEXISTE",
    "JANEIRO",
    "FEVEREIRO",
    "MARÇO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO"
];


module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [10, 10, 10, 30],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{}]},
				{
					table: {   // 1   2   3   4   5   6   7   8   9  10  11 
						       //CD  DD NOM APR QTD LOT NFE EMI  END CNP  UF
						widths: [30, 55, 55, 60, 25, 28, 22, 32, 100, 55, 10],
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 						
						{ text: 'Página: ' + ('00000' + page.toString()).slice(-5),
						  font: 'Courier',
						  fontSize: 8, 
						  alignment: 'right'
						}
					],
					margin: [20, 20]
				};
			}
		};

        return new Promise(async (resolve, reject) => {
			api.livrocontrolado().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let linhas = 0;
					let paginas = (res.results.length <= 50 ? 1 : Math.trunc(res.results.length / 50) + ((res.results.length % 50) > 0 ? 1 : 0));
					params.abertura == 'T' ? paginas ++ : paginas += 0;
					params.encerramento == 'T' ? paginas ++ : paginas += 0;

					// termo de abertura

					if(params.abertura == 'T') {
						let paginasExtenso = utils.number.ValorPorExtenso(paginas).replace('REAL', '').replace('REAIS', '');
						rows.push([
							{
								text: [
									{
										text: '\n\n\n\nRELACAO MENSAL DE VENDAS DE MEDICAMENTOS CONTROLADOS\n\n\n\n',
										font: 'Courier',
										fontSize: 14,												
										alignment: 'center',
										border: [false, false, false, false]
									},
									{
										text: 'PORTARIA 344/98\n\n\n\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center',
										border: [false, false, false, false]
									},	
									{
										text: 'EMPRESA: HOSPITALAR DISTRIBUIDORA DE MEDICAMENTOS LTDA - EPP\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},	
									{
										text: 'ENDEREÇO: RUA ADILIO ARTONI 46\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},	
									{
										text: 'BAIRRO: JARDIM PETROPOLIS - CEP: 19060-340\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},	
									{
										text: 'PRESIDENTE PRUDENTE/SP\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},
									{
										text: 'CNPJ: 03.375.328/0001-80 - INSCR. ESTADUAL: 562.172.900.119\n\n\n\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},	
									{
										text: 'T E R M O   D E   A B E R T U R A\n\n\n\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},
									{
										text: `TEXTO PARA ALINHAMENTO VAMOS DEIXAR DE`,
										color: 'white'
									},
									{
										text: `ESTE LIVRO SERVIRA PARA REGISTRO DE VENDAS DE MEDICAMENTOS CONTROLADOS PELA PORTARIA No. 344/98 DA LISTA ${params.tipo == 'TD' ? '(TODAS)' : params.tipo} E CONTERA ${('000000' + paginas).slice(-6)} (${paginasExtenso}) PAGINAS, DA EMPRESA HOSPITALAR DISTRIBUIDORA DE MEDICAMENTOS LTDA - EPP\n\n\n\n\n`,
										font: 'Courier',
										fontSize: 14,
										alignment: 'justify'

									},
									{
										text: `PRESIDENTE PRUDENTE/SP, ${params.inicio.slice(0, 2)} DE ${MesExtenso[parseInt(params.inicio.slice(3, 5))]} DE ${params.inicio.slice(6, 10)}.\n\n\n\n\n\n\n`,
										font: 'Courier',
										fontSize: 14,	
										alignment: 'center'	
									},
									{
										text: [
											{   
												text: '\n\n\n\naa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: '__________________________',
											    font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: '_____________________________\n',
												font: 'Courier',
												fontSize: 10,
											},
											{   
												text: 'aa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'WILSON JOSE PINTO DA SILVA',
											    font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'RAFAEL GARCIA PIRES DE ARAUJO\n',
												font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'aa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'RESPONSAVEL LEGAL',
											    font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'RESPONSAVEL TECNICO\n',
												font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'a'.repeat(61),
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'No. CRF: 36088\n\n\n\n\n\n\n',
												font: 'Courier',
												fontSize: 10
											}
										]
									}								
								],
								colSpan: 11,
								boder: [false, false, false, false]  //
                            },{},{},{},{},{},{},{},{},{},{}
						]);
					}

					rows.push(linhaEmBranco())
					rows.push(cabecalhoLivro(params, false)); // primeiro cabeçalho
					rows.push(linhaEmBranco());	
					rows.push(cabecalhoRepresentante());
					rows.push(cabecalhoProduto());	
					
					for(let i in res.results){
                        const model = res.results[i];
						const codigoDCB = (model['PRODUTOS_APLICACAO'] || '###').split('#')[0];
						const descriDCB = (model['PRODUTOS_APLICACAO'] || '###').split('#')[1];
						const nomeDCB = (model['PRODUTOS_APLICACAO'] || '###').split('#')[2];
						const apreDCB = (model['PRODUTOS_APLICACAO'] || '###').split('#')[3];

						if(linhas > 50) {
							linhas = 0;													
							rows.push(cabecalhoLivro(params, true));
							rows.push(cabecalhoRepresentante());
							rows.push(cabecalhoProduto());
						}
						
						rows.push([
							{
								text: codigoDCB,
								font: 'Courier',
								fontSize: 5,
								border: [false, false, false, false]
                            },
                            {
								text: descriDCB.substring(0, 18),
								font: 'Courier',
								fontSize: 5,
								border: [false, false, false, false]
                            },
                            {
								text: nomeDCB.substring(0, 18),
								font: 'Courier',
								fontSize: 5,
								border: [false, false, false, false]
                            },
                            {
								text: apreDCB.substring(0, 18),
								alignment: 'left',								
								font: 'Courier',
								fontSize: 5,
								border: [false, false, false, false]
                            },
                            {
								text: model['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
								font: 'Courier',
								fontSize: 5,
								border: [false, false, false, false],
                                alignment: 'right'
                            },
                            {
								text: model['MOVIMENTOSITENS_HORAENTREGA'],
								font: 'Courier',
								border: [false, false, false, false],
								fontSize: 5
							},
                            {
								text: model['MOVIMENTOS_NUMERO'],
								alignment: 'right',
								border: [false, false, false, false],
								font: 'Courier',
								fontSize: 5
							},
                            {
								text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								font: 'Courier',
								fontSize: 5,
								border: [false, false, false, false]
							},
							{
								text: model['PESSOAS_ENDERECO'].substring(0, 30),
								font: 'Courier',
								fontSize: 5,
								border: [false, false, false, false]
                            },							
							{
								text: utils.string.maskCnp(model['PESSOAS_CPFCNPJ']),
								font: 'Courier',
								fontSize: 5,
								border: [false, false, false, false]
							},
							{
								text: model['CIDADES_ESTADO'],
								alignment: 'center',
								font: 'Courier',								
								fontSize: 5,
								border: [false, false, false, false]
                            }
						]);

						linhas++

					}

					if(params.encerramento == 'T') {
						let paginasExtenso = utils.number.ValorPorExtenso(paginas).replace('REAL', '').replace('REAIS', '');
						rows.push([
							{
								pageBreak: 'before',
								text: [
									{
										text: '\n\n\n\nRELACAO MENSAL DE VENDAS DE MEDICAMENTOS CONTROLADOS\n\n\n\n',
										font: 'Courier',
										fontSize: 14,												
										alignment: 'center',
										border: [false, false, false, false]
									},
									{
										text: 'PORTARIA 344/98\n\n\n\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center',
										border: [false, false, false, false]
									},	
									{
										text: 'EMPRESA: HOSPITALAR DISTRIBUIDORA DE MEDICAMENTOS LTDA - EPP\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},	
									{
										text: 'ENDEREÇO: RUA ADILIO ARTONI 46\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},	
									{
										text: 'BAIRRO: JARDIM PETROPOLIS - CEP: 19060-340\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},	
									{
										text: 'PRESIDENTE PRUDENTE/SP\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},
									{
										text: 'CNPJ: 03.375.328/0001-80 - INSCR. ESTADUAL: 562.172.900.119\n\n\n\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},	
									{
										text: 'T E R M O   D E   E N C E R R A M E N T O\n\n\n\n',
										font: 'Courier',
										fontSize: 14,
										alignment: 'center'
									},
									{
										text: `TEXTO PARA ALINHAMENTO VAMOS DEIXAR DE`,										
										color: 'white'
									},
									{
										text: `ESTE LIVRO SERVIU PARA REGISTRO DE VENDAS DE MEDICAMENTOS CONTROLADOS PELA PORTARIA No. 344/98 DA LISTA ${params.tipo == 'TD' ? '(TODAS)' : params.tipo} E CONTEM ${('000000' + paginas).slice(-6)} (${paginasExtenso}) PAGINAS, DA EMPRESA HOSPITALAR DISTRIBUIDORA DE MEDICAMENTOS LTDA - EPP\n\n\n\n\n`,
										font: 'Courier',
										fontSize: 14,
										alignment: 'justify'

									},
									{
										text: `PRESIDENTE PRUDENTE/SP, ${params.final.slice(0, 2)} DE ${MesExtenso[parseInt(params.final.slice(3, 5))]} DE ${params.final.slice(6, 10)}.\n\n\n\n\n\n\n`,
										font: 'Courier',
										fontSize: 14,	
										alignment: 'center'	
									},
									{
										text: [
											{   
												text: '\n\n\n\naa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: '__________________________',
											    font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: '_____________________________\n',
												font: 'Courier',
												fontSize: 10,
											},
											{   
												text: 'aa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'WILSON JOSE PINTO DA SILVA',
											    font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'RAFAEL GARCIA PIRES DE ARAUJO\n',
												font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'aa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'RESPONSAVEL LEGAL',
											    font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'RESPONSAVEL TECNICO\n',
												font: 'Courier',
												fontSize: 10
											},
											{   
												text: 'a'.repeat(61),
											    font: 'Courier',
												fontSize: 10,
											    color: 'white'
										    },
											{
												text: 'No. CRF: 36088\n\n\n\n\n\n\n',
												font: 'Courier',
												fontSize: 10
											}
										]
									}								
								],
								colSpan: 11,
								boder: [false, false, false, false]  //
                            },{},{},{},{},{},{},{},{},{},{}
						]);
					}

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const cabecalhoProduto = function() {

	return [
		{
			text: 'No.Codigo\nna DCB',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'									
		},
		{
			text: 'Descrição da\nDCB',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'									
		},								
		{
			text: 'Nome do\nMedicamento',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center',
		},
		{
			text: 'Apresentação e\nConcentração',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'
		},
		{
			text: 'Qtde\nVendida',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'

		},
		{
			text: 'No.Lote\nMedicamen',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'
		},
		{
			text: 'Nro da\nNota',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'
		},
		{
			text: 'Data da\nNotaFiscal',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'
		},
		{
			text: '\nComprador Endereço Completo',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'
		},
		{
			text: '\nC.N.P.J.',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'
		},
		{
			text: '\nUF',
			font: 'Courier',
			fontSize: 5,
			alignment: 'center'
		}
	]
}

const linhaEmBranco = function() {

	return [
		{
			text: 'A',
			fontSize: 10,
			font: 'Courier',
			color: 'white', 
			colSpan: 11, border: [false, false, false, false]},
		{},{},{},{},{},{},{},{},{},{}
	]

};

const cabecalhoRepresentante = function() {

	return [
		{
			text: '\n\n\n______________________________\nWILSON JOSE PINTO DA SILVA\nRepresentante Legal',
			alignment: 'center',
			style: { font: 'Courier', fontSize: 7 },
			colSpan: 3,
			border: [false, false, false, false]
		},{},{},
		{
			text: '',
			border: [false, false, false, false]
		},
		{
			text: '\n\n\n________________________________\nRAFAEL GARCIA PIRES DE ARAUJO\nResponsável Técnico (CRF No. 36088)',
			alignment: 'center',
			style: { font: 'Courier', fontSize: 7 },
			colSpan: 5,
			border: [false, false, false, false]
		},{},{},{},{},
		{
			text: '',
			colSpan: 2,
			border: [false, false, false, false]
		},{}
	]

};

const cabecalhoLivro = function(params, pageFeed) {

	const imgCarimbo1 = `${appRoot}/resources/images/headers/carimbo1.png`;
	const imgCarimbo2 = `${appRoot}/resources/images/headers/carimbo2.png`;
	const mesAno = params.inicio.toString().slice(-7);

	return [
		{
			pageBreak: pageFeed ? 'before' : null,			
			table: {
				body: [
					[   {	image: imgCarimbo1,	width: 120,	height: 80 },
						{
							text: [
								{
									text: 'SECRETARIA DA SAÚDE.................\nAUTORIDADE SANITARIA................\n\n',
									style: {
										font: 'Courier',
										fontSize: 7
									}
								},
								{
									text: `RELAÇÃO MENSAL DE VENDA DE MEDICAMENTOS\nSUJEITOS A CONTROLE ESPECIAL\n(R M V)\n\nINDÚSTRIA/DISTRIBUIDORA\n\n`,
									alignment: 'center',
									style: {
										font: 'Courier',
										fontSize: 7
									}
								},		
								{
									text: `HOSPITALAR DIST MEDICAMENTOS LTDA - EPP`,
									style: { font: 'Courier', fontSize: 7 }
								},
								{   
									text: 'Espaco',
									style: { font: 'Courier', fontSize: 7 },
									color: 'white'
								},
								{
									text: `AUT. DE FUNCIONAMENTO No. 1.05.356-1\n`,
									style: { font: 'Courier', fontSize: 7 }
								},
								{
									text: `RUA ADILIO ARTONI 46`,
									style: { font: 'Courier', fontSize: 7 }
								},
								{   
									text: 'Espaco',
									style: { font: 'Courier', fontSize: 7 },
									color: 'white'
								},
								{
									text: `LICENCA DE FUNCIONAMENTO No. 354140616-514-000025-1-8\n`,
									style: { font: 'Courier', fontSize: 7 }
								},
								{
									text: `JARDIM PETROPOLIS`,
									style: { font: 'Courier', fontSize: 7 }
								},
								{   
									text: 'Espaco',
									style: { font: 'Courier', fontSize: 7 },
									color: 'white'
								},
								{
									text: `CEP 19060-340`,
									style: { font: 'Courier', fontSize: 7 }
								},
								{   
									text: 'Espaco',
									style: { font: 'Courier', fontSize: 7 },
									color: 'white'
								},
								{
									text: `Fone: (18) 3221-2232\n`,
									style: { font: 'Courier', fontSize: 7 }
								},
								{
									text: `PRESIDENTE PRUDENTE/SP`,

									style: { font: 'Courier', fontSize: 7 }
								},
								{   
									text: 'Espaco',
									width: 20,
									style: { font: 'Courier', fontSize: 7 },
									color: 'white'
								},
								{
									text: `AUTORIZAÇÃO ESPECIAL No. 1.21.376-0 `,
									width: 150,								
									style: { font: 'Courier', fontSize: 7 }
								}
							],				
						},
						{
							stack: [
								{
									image: imgCarimbo2,
									width: 60,
									height: 60,		
								},
								{
									text: `\nMES/ANO: ${mesAno}`,
									style: { font: 'Courier', fontSize: 7 }
								}
							],
							alignment: 'center'				
						}
				    ]
				]
			},
			layout: 'noBorders',
			colSpan: 11,
			border: [false, false, false, false]			
		},{},{},{},{},{},{},{},{},{},{}
	]
}