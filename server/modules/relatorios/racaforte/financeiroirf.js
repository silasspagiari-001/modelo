'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 30, 60],
			content: [  //  1  2  3  4  5  6  7  8  9
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Num Pes Msg  UF Emi Vct Pgt Vlr Prz
							   // 1    2   3   4   5   6   7   8   9 
						widths: [35, 170, 40, 12, 45, 45, 45, 50, 20],
						headerRows: 7,
						body: []
					},
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						{ text:  moment.tz(params.timezone).format('DD/MM/YYYY') + ' ' +  'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [20, 10]
				};
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

		};
 
        return new Promise(async (resolve, reject) => {
			api.relfinanceiros().read(params)
				.then(res => {
					if(!res.results[0]) {
						resolve({ results: [] });
						return;
					}
					
					
					let rows = docDefinition.content[1].table.body;
					
					let ultimoQ; // Controle de quebra
 
					let totalOriginal  = 0;
					let totalAberto    = 0;
					let totalJuros     = 0;
					let totalPago      = 0;

					let geralOriginal  = 0;
					let geralAberto    = 0;
					let geralJuros     = 0;
					let geralPago      = 0;

					let quebra         = params.quebra == 'true';
					let semnn          = params.semnn == 'true';
					let ordem          = params.ordem;

					const ordemRelatorio = ordem == 0 ? 'VENCIMENTO' :
					                       ordem == 1 ? 'PAGAMENTO' :
										   ordem == 2 ? 'EMISSAO' :
										   ordem == 3 ? 'PESSOA' :
										   ordem == 4 ? 'NUMERO' :
										   ordem == 5 ? 'PORTADOR' :
										   ordem == 6 ? 'APLICACAO' :
										   ordem == 7 ? 'CENTRO CUSTO' :  
										                'NENHUMA'

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/${params.empresacnpj}.png`;
					}

                    rows.push(
                        [
                            {
								image: pathLogo,
                                colSpan: 9,
                                width: 150,
								alignment: 'center',
                                lineHeight: 0,
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{}
						],
						[
                            {
								text: utils.string.maskCnp(params.empresacnpj),
								colSpan: 9,
                                alignment: 'center',
                                margin: [-5, -5, -5, -5],
                                lineHeight: 0.6,
								style: {bold: false,	fontSize: 8},
								border: [false, false, false, false]																
							},{},{},{},{},{},{},{},{}

						],	
						[
                            {
								text: res.results[0]['EMPRESAS_NOME'],
								colSpan: 9,
                                alignment: 'center',
                                lineHeight: 0.5,
								style: {bold: true,	fontSize: 7},
								border: [false, false, false, false]																
							},{},{},{},{},{},{},{},{}

						],	

						[
                            {
								text: res.results[0]['EMPRESAS_ENDERECO'] + ', ' + res.results[0]['EMPRESAS_NUMERO'] + ' - ' +res.results[0]['EMPRESAS_BAIRRO'],
								colSpan: 9,
                                alignment: 'center',
                                lineHeight: 0.5,
								style: {bold: false,	fontSize: 5.5},
								border: [false, false, false, false]																
							},{},{},{},{},{},{},{},{}

						],	

						[
                            {
								text: res.results[0]['EMPRESAS_CIDADES'] + ' - ' + res.results[0]['EMPRESAS_ESTADO'],
								colSpan: 9,
                                alignment: 'center',
                                lineHeight: 2,
								style: {bold: false,	fontSize: 5.5},
								border: [false, false, false, false]																
							},{},{},{},{},{},{},{},{}

						],	


						[
                            {
								text:    res.results[0]['FINANCEIROS_ID_PESSOAS'] + ' - ' + res.results[0]['PESSOAS_NOME'] + '          ' + utils.string.maskCnp(res.results[0]['PESSOAS_CPFCNPJ']) + '   -   ' + res.results[0]['PESSOAS_INSCRICAO'] ,
                                lineHeight: 0.8,
								colSpan: 9,
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]																
							},{},{},{},{},{},{},{},{}

						],	


						[
                            {
								text:    res.results[0]['PESSOAS_ENDERECO'] + ' - ' + res.results[0]['CIDADES_NOME'] + ' - ' + res.results[0]['CIDADES_ESTADO'] ,
                                lineHeight: 1,
								colSpan: 9,
								style: {bold: false,	fontSize: 8},
								border: [false, false, false, false]																
							},{},{},{},{},{},{},{},{}

						],	


                        [{text: 'Número',       style: 'tableHeader', alignment: 'center'},
						 {text: 'Pessoa',       style: 'tableHeader',colSpan: 2, alignment: 'left'},
						 {},
						 {text: 'UF',           style: 'tableHeader', alignment: 'center'},
						 {text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
						 {text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
						 {text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
						 {text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},						 
                         {text: 'Prazo',        style: 'tableHeader', alignment: 'center'}]
                    )
 
					for(let i in res.results){
						let model = res.results[i];

						rows.push([
							{
								text: model['FINANCEIROS_NUMERO'].toString() + '/' + model['FINANCEIROS_PARCELA'].toString(),
								alignment: 'right',
   								style: {bold: false,	fontSize: 8},


							},
							{
								text: `${('000000' + model['FINANCEIROS_ID_PESSOAS']).slice(-6)} ${model['PESSOAS_NOME']}`.slice(0, 50),
								alignment: 'left',
                                colSpan: 2,
								style: {bold: false,	fontSize: 8},
							},							
							{},
							{
								text: model['CIDADES_ESTADO'],
								alignment: 'right',
								style: {bold: false,	fontSize: 8},
							},
							{
								text: moment(res.results[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: {bold: false,	fontSize: 8},
							},
							{
								text: moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: {bold: false,	fontSize: 8},
							},
							{
								text: moment(res.results[i]['FINANCEIROS_PAGAMENTO'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(res.results[i]['FINANCEIROS_PAGAMENTO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: {bold: false,	fontSize: 8},
							},
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ORIGINAL']),
								alignment: 'right',
								style: {bold: false,	fontSize: 8},
							},
							{
								text: (model['FINANCEIROS_STATUS'] == 'P' ? 'PAGO' : model['PRAZOCALCULADO_FINANCEIRO']),
								alignment: 'right',
								style: {bold: false,	fontSize: 7},
							}
						]);

						totalOriginal  += (model['FINANCEIROS_ORIGINAL'] * 100);
						totalAberto    += (model['FINANCEIROS_ABERTO'] * 100);
						totalPago      += (model['FINANCEIROS_PAGO'] * 100);
						totalJuros     += (model['FINANCEIROS_JUROS'] * 100);

						geralOriginal  += (model['FINANCEIROS_ORIGINAL'] * 100);
						geralAberto    += (model['FINANCEIROS_ABERTO'] * 100);
						geralPago      += (model['FINANCEIROS_PAGO'] * 100);
						geralJuros     += (model['FINANCEIROS_JUROS'] * 100);

					}

                    rows.push([
						{
							text: '',
							fontSize: 8,
							bold: true,
							alignment: 'right',
							colSpan: 9,
							border: [false, false, false, false]							
						},{},{},{},{},{},{},{},{}
					]);															

		
					rows.push([
						{
							text: `TOTAL GERAL -> (PAGO) ${utils.number.float2moeda(totalPago / 100) || '0,00'}`,
							fontSize: 8,
							bold: true,
							alignment: 'right',
							colSpan: 9,
							border: [false, false, false, false]							
						},{},{},{},{},{},{},{},{}
					]);															


                    
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const siglaDocumento = function(idDocumento) {

	if(idDocumento == '0001') {	return 'ORC'; } else
	if(idDocumento == '0002') { return 'PED'; } else
	if(idDocumento == '0003') { return 'NFS'; } else
	if(idDocumento == '0004') { return 'REQ'; } else
	if(idDocumento == '0005') { return 'NFE'; } else
	if(idDocumento == '0006') { return 'CPA'; } else	
	if(idDocumento == '0007') { return 'ORD'; } else
	if(idDocumento == '0008') { return 'DUP'; } else
	if(idDocumento == '0009') { return 'DUP'; } else 
	                          { return 'NDA'}
	
}