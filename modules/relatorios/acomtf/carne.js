'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const codes = require('rescode');

const getFinanceirosById = async function(id, params){
	try {
		const ids = id.toString().split(',');
		let sqlWhere = ` where `;

		sqlWhere += ids.reduce((result, id) => {
			return result += ` FINANCEIROS_ID = '${id}' or `
		}, '').slice(0, -3);
		
		const sqlSearch = `select 
				FINANCEIROS_ID,
				FINANCEIROS_TIPO,
				FINANCEIROS_ID_EMPRESAS,
				EMPRESAS_FANTASIA,
				EMPRESAS_TELEFONE, 
				EMPRESAS_CELULAR,
				EMPRESAS_NOME,
				EMPRESAS_EMAIL,
				EMPRESAS_INSCRICAO,
				EMPRESAS_CPFCNPJ,
				EMPRESAS_ENDERECO,
				EMPRESAS_NUMERO,
				EMPRESAS_BAIRRO,
				CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
				CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
				CIDADESPESSOA.CIDADES_NOME as PESSOAS_CIDADES,
				CIDADESPESSOA.CIDADES_ESTADO as PESSOAS_ESTADO,
				FINANCEIROS_ID_DOCUMENTOS,
				DOCUMENTOS_COLETACARTAO,
				FINANCEIROS_ID_MOVIMENTOS,
				FINANCEIROS_ID_USUARIOS,
				USUARIOS_NOME,
				USUARIOS_EMAIL,
				USUARIOS_TELEFONE,
				USUARIOS_CELULAR,
				FINANCEIROS_ID_PESSOAS,
				PESSOAS_CPFCNPJ,
				PESSOAS_TIPO,
				PESSOAS_ID_CIDADES,
				PESSOAS_INSCRICAO,
				PESSOAS_NOME,
				PESSOAS_FANTASIA,
				PESSOAS_ENDERECO,
				PESSOAS_ENDERECOCOBRANCA,
				PESSOAS_BAIRROCOBRANCA,
				PESSOAS_CEPCOBRANCA,
				PESSOAS_NUMEROCOBRANCA,
				CIDADESCOBRANCA.CIDADES_NOME as CIDADESCOBRANCA_CIDADE_COBRANCA,
				CIDADESCOBRANCA.CIDADES_ESTADO as CIDADESCOBRANCA_ESTADO_COBRANCA,
				PESSOAS_NUMERO,
				PESSOAS_BAIRRO,
				PESSOAS_EMAIL,
				PESSOAS_PAGINA,
				PESSOAS_TELEFONE,
				PESSOAS_CELULAR,
				PESSOAS_CEP,
				PESSOAS_CREDITO,
				CIDADES.CIDADES_NOME,
				CIDADES.CIDADES_ESTADO,
				MOVIMENTOS_ID_PROPRIEDADES,
				PROPRIEDADES_CPFCNPJ,
				PROPRIEDADES_NOME,
				PROPRIEDADES_CEP,
				PROPRIEDADES_ENDERECO,
				PROPRIEDADES_NUMERO,
				PROPRIEDADES_BAIRRO,
				PROPRIEDADES_CEP,
				CIDADESPROPRIEDADE.CIDADES_NOME as CIDADES_NOMEPROPRIEDADE,
				CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
				FINANCEIROS_ID_PORTADORES,
				PORTADORES_NOME,
				PORTADORES_ID_BANCOS,
				BANCOS_NOME,
				PORTADORES_AGENCIA,
				PORTADORES_CONTA,
				PORTADORES_CONVENIO,
				PORTADORES_CARTEIRA,
				PORTADORES_CPFCNPJ,
				PORTADORES_ENDERECO,
				PORTADORES_NUMERO,
				PORTADORES_BAIRRO,
				PORTADORES_CEP,
				PORTADORES_PROTESTO,
				PORTADORES_MORA,
				PORTADORES_MULTA,
				CIDADESPORTADOR.CIDADES_NOME as CIDADES_NOMEPORTADOR,
				CIDADESPORTADOR.CIDADES_ESTADO as CIDADES_ESTADOPORTADOR,
				FINANCEIROS_ID_PRAZOS,
				PRAZOS_NOME,
				FINANCEIROS_ID_APLICACOES,
				APLICACOES_NOME,
				FINANCEIROS_ID_CUSTOS,
				CUSTOS_NOME,
				FINANCEIROS_PARCELA,
				FINANCEIROS_PARCELAS,
				FINANCEIROS_NOSSONUMERO,
				FINANCEIROS_BOLETO,
				FINANCEIROS_EMISSAO,
				FINANCEIROS_VENCIMENTO,
				FINANCEIROS_PAGAMENTO,
				FINANCEIROS_BAIXA,
				FINANCEIROS_ORIGINAL,
				FINANCEIROS_ABERTO,
				FINANCEIROS_DESCONTOS,
				FINANCEIROS_JUROS,
				FINANCEIROS_TAXAS,
				FINANCEIROS_PAGO,
				FINANCEIROS_TOTAL,
				FINANCEIROS_OBSERVACOES,
				FINANCEIROS_STATUS,
				FINANCEIROS_EXPORTADO,
				FINANCEIROS_LOG,
				FINANCEIROS_NUMERO,
				FINANCEIROS_SERIE,
				FINANCEIROS_ID_EMPRESAORIGEM,
				FINANCEIROS_NUMEROORIGEM,
				FINANCEIROS_SERIEORIGEM,
				iif(FINANCEIROS_STATUS = 'P',FINANCEIROS_PAGAMENTO - FINANCEIROS_VENCIMENTO,FINANCEIROS_VENCIMENTO - CURRENT_DATE) as PRAZOCALCULADO_FINANCEIRO,
				(FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZOCALCULADO_BOLETO
			from FINANCEIROS
				left outer join EMPRESAS                      on EMPRESAS_ID                   = FINANCEIROS_ID_EMPRESAS
				left outer join DOCUMENTOS                    on DOCUMENTOS_ID                 = FINANCEIROS_ID_DOCUMENTOS
				left outer join PRAZOS                        on PRAZOS_ID                     = FINANCEIROS_ID_PRAZOS
				left outer join PESSOAS                       on PESSOAS_ID                    = FINANCEIROS_ID_PESSOAS
				left outer join PORTADORES                    on PORTADORES_ID                 = FINANCEIROS_ID_PORTADORES
				left outer join MOVIMENTOS                    on MOVIMENTOS_ID                 = FINANCEIROS_ID_MOVIMENTOS
				left outer join PROPRIEDADES                  on PROPRIEDADES_ID               = MOVIMENTOS_ID_PROPRIEDADES
				left outer join BANCOS                        on BANCOS_ID                     = PORTADORES_ID_BANCOS
				left outer join CIDADES                       on CIDADES.CIDADES_ID            = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESPESSOA      on CIDADESPESSOA.CIDADES_ID      = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESPORTADOR    on CIDADESPORTADOR.CIDADES_ID    = PORTADORES_ID_CIDADES
				left outer join CIDADES as CIDADESEMPRESA     on CIDADESEMPRESA.CIDADES_ID     = EMPRESAS_ID_CIDADES
				left outer join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES_ID_CIDADES
				left outer join CIDADES as CIDADESCOBRANCA    on CIDADESCOBRANCA.CIDADES_ID    = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
				left outer join APLICACOES                    on APLICACOES_ID                 = FINANCEIROS_ID_APLICACOES
				left outer join CUSTOS                        on CUSTOS_ID                     = FINANCEIROS_ID_CUSTOS
				left outer join USUARIOS                      on USUARIOS_ID                   = FINANCEIROS_ID_USUARIOS
			${sqlWhere}
			order by FINANCEIROS_ID_EMPRESAS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA  `;

		const results = await samosFB.executeSQL(sqlSearch, params);

		await Promise.all(results.map(async financeiro => {
			const sqlItens = `select 
				FINANCEIROSITENS.*, 
				APLICACOES_NOME, 
				PORTADORES_NOME
			from FINANCEIROSITENS
			left outer join APLICACOES on APLICACOES_ID = FINANCEIROSITENS_ID_APLICACOES
			left outer join PORTADORES on PORTADORES_ID = FINANCEIROSITENS_ID_PORTADORES
			where FINANCEIROSITENS_ID_FINANCEIROS = ${financeiro['FINANCEIROS_ID']} 
			order by FINANCEIROSITENS_ID`;

			financeiro['FINANCEIROS_ITENS'] = await samosFB.executeSQL(sqlItens, params);
		}));

		return { 
			results, 
			total: results.length 
		};
	} catch(error) {
		const msg = 'Falha ao buscar financeiros por id';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
} 

const MesExtenso = [
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

let mesReferencia;
let impressos = 0;

codes.loadModules(["code128"], {"includetext" : false});

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 25, 20, 25],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableReport',
					table: {   //[Canhoto] D   [ Ficha           ]
						       // 1   2    3   4   5   6   7   8   9
						widths: [70, 70,   5, 40, 50, 40, 40, 20, 110],
						body: []
					}
				}
			],
			styles: {
				tableReport: {
					fontSize: 9,  //10
					margin: [20, 25, 20, 25]
				},
				tableHeader: {
					bold: true,
					fontSize: 9,  //10
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			getFinanceirosById(params.ids, params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){

						let model = res.results[i];

						let barcodes  = await getBarcode(completeChars(model['FINANCEIROS_ID_EMPRESAS'], 3) + completeChars(model['FINANCEIROS_NUMERO'], 7) + completeChars(model['FINANCEIROS_PARCELA'], 3));

						mesReferencia = MesExtenso[(parseInt(model['FINANCEIROS_VENCIMENTO'].substr(5, 2)) - 1)] + '/' +
						                model['FINANCEIROS_VENCIMENTO'].substr(0, 4)

						let pathLogo;

						try {
							pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
						} catch(error) {
							pathLogo = `${appRoot}/resources/images/headers/default.png`;
						}

						rows.push([
							{
								image: pathLogo,
								width: 60,
								alignment: 'left',
								border: [false, false, true, true]
							},
							{
								text: 'RECIBO DO SACADO',
								style: {fontSize: 8},
								border: [true, false, false, true]
							},							
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								image: pathLogo,
								width: 60,
								colSpan: 6,								
								alignment: 'left',
								border: [false, false, false, true]
							},{},{},{},{},{}
						],
						[
							{
								text: [
									{
										text: 'CEDENTE:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['EMPRESAS_FANTASIA'],
										alignment: 'left',
										style: {bold: true}
									}
								],
								style: 'tableExample',
								colSpan: 2,
								border: [false, true, false, true]
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'LOCAL DE PAGAMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['EMPRESAS_FANTASIA'],
										alignment: 'left',
										style: {bold: true}
									}
								],
								border: [false, true, true, true],								
								colSpan: 5,
								style: 'tableExample'
							},{},{},{},{},
							{
								text: [
									{
										text: 'VENCIMENTO: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]
							}
						],
						[
							{
								text: [
									{
										text: 'SACADO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['PESSOAS_NOME'],
										alignment: 'left',
										style: {bold: true}
									}
								],
								border: [false, true, false, true],								
								colSpan: 2
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'CEDENTE:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['EMPRESAS_NOME'],
										alignment: 'left',
										style: {bold: true}
									}
								],
								border: [false, true, true, true],
								colSpan: 5,
								style: 'tableExample'
							},{},{},{},{},
							{
								text: [
									{
										text: 'PARCELA: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('00' + model['FINANCEIROS_PARCELA']).slice(-2) + '/' +
										      ('00' + model['FINANCEIROS_PARCELAS']).slice(-2),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]								
							}
						],
						[
							{
								text: [
									{
										text: 'PARCELA:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('00' + model['FINANCEIROS_PARCELA']).slice(-2) + '/' +
										      ('00' + model['FINANCEIROS_PARCELAS']).slice(-2),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [false, true, true, true]
							},
							{
								text: [
									{
										text: 'VENCIMENTO: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]									
							},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'DATA DE EMISSAO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: moment(res.results[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [false, true, true, true],								
								colSpan: 2
							},{},
							{
								text: [
									{
										text: 'ESPÉCIE:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: 'CARNÊ',
										alignment: 'center',
										style: {bold: true}
									}
								],
								style: 'tableExample'
							},{
								text: [
									{
										text: 'MOEDA:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: 'REAL',
										alignment: 'center',
										style: {bold: true}
									}
								],
								colSpan: 2,
								style: 'tableExample'
							},{},
							{
								text: [
									{
										text: 'N.DOCUMENTO: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('000000' + model['FINANCEIROS_NUMERO']).slice(-6),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]
							}
						],
						[
							{
								text: [
									{
										text: '(=) VALOR DO DOCUMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: utils.number.float2moeda(model['FINANCEIROS_ORIGINAL']),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [false, true, false, true],								
								colSpan: 2
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: `${model['EMPRESAS_FANTASIA']} - ${model['EMPRESAS_ENDERECO']}, ${model['EMPRESAS_NUMERO']} - ${model['EMPRESAS_BAIRRO']}`,
										alignment: 'left'
									}
								],
								border: [false, true, false, false],								
								colSpan: 5
							},{},{},{},{},
							{
								text: [
									{
										text: '(=) VALOR DO DOCUMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: utils.number.float2moeda(model['FINANCEIROS_ORIGINAL']),
										alignment: 'center',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]								
							}
						],		
						[
							{
								text: [
									{
										text: '(-) DESCONTO/ABATIMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								colSpan: 2,
								border: [false, true, false, true]								
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
								alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: 'Presidente Prudente - SP Tel: (18) 3222-4926', // Fixo por enquanto - observacoes ficha
								colSpan: 5,
								border: [false, false, false, false]
							},{},{},{},{},
							{
								text: [
									{
										text: '(-) DESCONTO/ABATIMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								border: [true, true, false, true]								
							}
						],
						[
							{
								text: [
									{
										text: '(+) MORA/MULTA:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								colSpan: 2,
								border: [false, true, false, true]								
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
								alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: '(PAGUE EM DIA! EVITE PAGAR JUROS)',
								colSpan: 5,
								border: [false, false, true, false]
							},{},{},{},{},
							{
								text: [
									{
										text: '(+) MORA/MULTA:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								border: [true, true, false, true]								
							}
						],
						[
							{
								text: [
									{
										text: 'VALOR COBRADO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'left',
										style: {color: 'white'}
									}
								],
								border: [false, true, false, true],
								colSpan: 2
							},{},
							{   text: '|',  // Divisão entre canhoto e ficha
							    alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'SACADO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: model['PESSOAS_NOME'] + ' (' + ('000000' + model['FINANCEIROS_ID_PESSOAS']).slice(-6) + ')',
										alignment: 'left',
										style: {bold: true}
									}
								],
								colSpan: 5,
								border: [false, true, true, true]
							},{},{},{},{},
							{
								text: [
									{
										text: '(=) VALOR COBRADO: \n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: '0,00',
										alignment: 'center',
										style: {color: 'white'}
									}
								],
								border: [true, true, false, true]								
							}
						],
						[
							{
								text: [
									{
										text: 'N.DOCUMENTO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('000000' + model['FINANCEIROS_NUMERO']).slice(-6),
										alignment: 'right',
										style: {bold: true}
									}
								],
								border: [false, true, true, true]								
							},
							{
								text: [
									{
										text: 'SACADO:\n',
										alignment: 'left',
										style: {fontSize: 7}
									},
									{
										text: ('000000' + model['FINANCEIROS_ID_PESSOAS']).slice(-6),
										alignment: 'right',
										style: {bold: true}
									}
								],
								border: [true, true, false, true]								
							},
							{   text: '|',  // Divisão entre canhoto e ficha
								alignment: 'center',
								border: [false, false, false, false]
							},							
							{
								colSpan: 3,	
								border: [false, false, false, false],
								table: {
									body: [
										[ 
											barcodes ? {
												image: 'data:image/png;base64,' + barcodes,
												width: 100,
												height: 12,
												alignment: 'center'														
											} : ''
										]
									]
								},
								layout: 'noBorders'
							},{},{},{
								text: 'AUTENTICACAO MECANICA',
								alignment: 'right',
								style: {fontSize: 7},
								colSpan: 3,
								border: [false, true, false, false]
							},{},{}
						],
						[
							{
								text: [
									{
										text: 'EMBRANCO\n',
										alignment: 'left',
										style: {color: 'white'}
									}
								],
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'EMBRANCO\n',
										alignment: 'left',
										style: {color: 'white'}
									}
								],
								border: [false, false, false, false]
							},
							{   text: '|',  // Divisão entre canhoto e ficha
								alignment: 'center',
								border: [false, false, false, false]
							},
							{
								text: mesReferencia,
								alignment: 'right',
								style: {fontSize: 12, bold: true},
								colSpan: 6,
								border: [false, false, false, false]								
							},{},{},{},{},{}
						]);

						impressos++

						if(multiplo(impressos, 3) && impressos < res.results.length) {
							rows.push([
								{
									text: '_ '.repeat(80),
									border: [false, false, false, false],
									colSpan: 9,
									pageBreak: 'after'
								},{},{},{},{},{},{},{},{}
							]);
						} else {
							rows.push([
								{
									text: '_ '.repeat(80),
									border: [false, false, false, false],
									colSpan: 9,
								},{},{},{},{},{},{},{},{}
							]);
						}

					}
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

function multiplo(valor, multiplo) {
	let resto = valor % multiplo;
	if(resto == 0){
		return true;
	} else {
		return false;
	}
};

const getBarcode = function(titulo) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('code128', titulo);
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};

const completeChars = function (str, chars, char = '0', direction = 'left') {
    var str = (str && str.toString) ? str.toString() : '',
        nCharsToComplete = chars - str.length;

    for (var i = 0; i < nCharsToComplete; i++) {
        if(direction == 'left'){
            str = char + str;
        } else if(direction == 'rigth'){
            str = str + char;
        } 
    }

    return str;
};