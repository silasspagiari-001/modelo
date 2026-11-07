'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFirebird'); 

module.exports = {
    read: async params => { 
		return new Promise(async (resolve, reject) => {
			const db = await samosFB.conectarBanco(params.client); 
            const lancamentos = await obterLancamentos(db, params);
            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [20, 20, 20, 20],  // E S D I 
				margin: [20, 10],
                content: [
                    {columns: [{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: { //  NUM SER ORD PES  NOM EMI VCT VLP
                            widths:  [45, 25, 18, 40, 160, 60, 60, 70],  // 8 Cols
                            body: []
                        }
                    }
                ],
                styles: {
                    tableExample: {
                        fontSize: 9,
                        margin: [0, 0, 0, 0]
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 9,
                        color: 'black'
                    }
                }
            };

            let rows = docDefinition.content[1].table.body;
            const cents = utils.number.cents.bind(utils.number);					
			const mesExtenso = ["MESZERO","JANEIRO","FEVEREIRO",
				                "MARÇO",  "ABRIL",  "MAIO",
			                    "JUNHO","JULHO","AGOSTO",
				                "SETEMBRO",	"OUTUBRO","NOVEMBRO",	"DEZEMBRO"];

            rows.push(		
            );

            for(let i in lancamentos){

                if(i > 0) {
                    rows.push([
                        {
                            text: '',
                            fontSize: 11,
                            colSpan: 8,
                            style: 'tableExample',
                            border: [false, false, false, false],
                            pageBreak: 'before'
                        },{},{},{},{},{},{},{}
                    ]);                        
                }

				const diaDigito = moment(lancamentos[i]['CONTACORRENTES_EMISSAO']).format('DD');
				const mesDigito = cents(moment(lancamentos[i]['CONTACORRENTES_EMISSAO']).format('MM')) / 100;
				const mesPorExtenso = mesExtenso[mesDigito];
				const anoDigito = moment(lancamentos[i]['CONTACORRENTES_EMISSAO']).format('YYYY');

                rows.push([
                    {
                        text: `${lancamentos[i]['CIDADES_NOME']}/${lancamentos[i]['CIDADES_ESTADO']}, ${diaDigito} DE ${mesPorExtenso} DE ${anoDigito}`,
                        fontSize: 12,
						alignment: 'right',
                        colSpan: 8,
                        style: 'tableExample'
                    },{},{},{},{},{},{},{}
                ],
				[
                    {
                        text: 'Numero',
                        style: 'tableHeader',
                        alignment: 'center',
                    },
                    {
                        text: 'Sér',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Ord',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Forn',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Nome Fornecedor',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Vencto',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Vlr Pago',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]);	

				const titulos = await obterTitulos(db, lancamentos[i]['CONTACORRENTES_ID']);

				if(titulos.length > 0) {
					for(let t in titulos) {
						const tit = titulos[t];
						rows.push([
							{
								text: tit['FINANCEIROS_NUMERO'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: tit['FINANCEIROS_SERIE'],
								alignment: 'center',
								style: 'tableExample'
							},						
							{
								text: ('00' + tit['FINANCEIROS_PARCELA']).slice(-2),
								alignment: 'right',
								style: 'tableExample'
							},		
							{
								text: ('000000' + tit['FINANCEIROS_ID_PESSOAS']).slice(-6),
								alignment: 'right',
								style: 'tableExample'
							},		
							{
								text: tit['PESSOAS_NOME'].slice(0, 32),
								fontSize: 8,
								alignment: 'left',
								style: 'tableExample'
							},			
							{
								text: moment(tit['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},	
							{
								text: moment(tit['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},	
							{
								text: utils.number.float2moeda(cents(tit['FINANCEIROS_PAGO']) / 100),
								alignment: 'right',
								style: 'tableExample'
							}
						]);			
					}
				}

				rows.push([
					{
						text: 'TOTAL',
						fontSize: 11,
						bold: true,
						alignment: 'right',
						colSpan: 6,
						style: 'tableExample'
					},{},{},{},{},{},
					{
						text: utils.number.float2moeda(cents(lancamentos[i]['CONTACORRENTES_VALOR']) / 100),
						colSpan: 2,
						fontSize: 11,
						bold: true,
						alignment: 'right',
						style: 'tableExample'
					},{}
				]);			

				rows.push([
					{
						text: '\n\n\n',
						fontSize: 11,
						colSpan: 8,

					},{},{},{},{},{},{},{}
				]);		
                
				rows.push([
					{
						text: '',
						colSpan: 4,
					},{},{},{},
                    {
                        text: 'Cópia: ' + ('000000' + lancamentos[i]['CONTACORRENTES_ID']).slice(-6) + ' CH',
                        fontSize: 14                        
                    },
                    {
                        text: 'Banco: ' + ('000' + lancamentos[i]['PESSOAS_NUMERO']).slice(-3),
                        colSpan: 3,
                        fontSize: 14
                    },{},{}
				]);		

				rows.push([
					{
						text: 'Assinado por:',
                        fontSize: 14,
						colSpan: 8
					},{},{},{},{},{},{},{}
				]);		
                
				rows.push([
					{
						text: 'Utilizado para:\n\n\n\n',
                        fontSize: 14,
						colSpan: 8
					},{},{},{},{},{},{},{}
				]);		

				rows.push([
					{
						text: '',
						colSpan: 5
					},{},{},{},{},
                    {
                        text: 'Visto:',
                        colSpan: 3,
                        fontSize: 14
                    },{},{}
				]);		
                
            }
  
            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterLancamentos = function(db, params) {

	const cents = utils.number.cents.bind(utils.number);

	const idAplicacao = cents(params.aplicacao) > 0 ? params.aplicacao : 214;
	
    const { 
		empresaLogada,
        pessoa, 
        inicio,
        final, 
    } = params;

    return new Promise(async (resolve, reject) => {
		let whereAplicacao = idAplicacao ? `CONTACORRENTES_ID_APLICACOES = ${idAplicacao} and` : ``;
		let sql = `
                select CONTACORRENTES_ID,
				       CONTACORRENTES_ID_EMPRESAS,
					   EMPRESAS_NOME,
					   CIDADES_NOME,
					   CIDADES_ESTADO,
				       CONTACORRENTES_EMISSAO,
					   CONTACORRENTES_ID_PESSOAS,
                       PESSOAS_NOME,
					   PESSOAS_NUMERO,
                       CONTACORRENTES_ID_APLICACOES,
                       CONTACORRENTES_NOME,
                       CONTACORRENTES_VALOR
                from CONTACORRENTES
                join PESSOAS  on PESSOAS_ID = CONTACORRENTES_ID_PESSOAS
				join EMPRESAS on EMPRESAS_ID = CONTACORRENTES_ID_EMPRESAS
				join CIDADES  on CIDADES_ID = EMPRESAS_ID_CIDADES
                where CONTACORRENTES_ID_EMPRESAS = ${empresaLogada} and
                    CONTACORRENTES_EMISSAO between '${inicio}' and '${final}' and
					${whereAplicacao}
                    CONTACORRENTES_ID_PESSOAS = ${pessoa}
                order by CONTACORRENTES_EMISSAO, CONTACORRENTES_ID`

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

const obterTitulos = function(db, lancamento) {
	
    return new Promise(async (resolve, reject) => {
		
		let sql = `
                select FINANCEIROS_ID,
				       FINANCEIROS_ID_EMPRESAS,
					   FINANCEIROS_NUMERO,
					   FINANCEIROS_SERIE, 
					   FINANCEIROS_PARCELA,
					   FINANCEIROS_ID_PESSOAS,
					   PESSOAS_NOME,
					   FINANCEIROS_EMISSAO,
					   FINANCEIROS_VENCIMENTO,
					   FINANCEIROS_ORIGINAL,
					   FINANCEIROS_PAGO
                from FINANCEIROS
                join PESSOAS  on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
				join EMPRESAS on EMPRESAS_ID = FINANCEIROS_ID_EMPRESAS
                where FINANCEIROS_NUMEROORIGEM = ${lancamento} and
                      FINANCEIROS_SERIEORIGEM = 'CH'
                order by FINANCEIROS_EMISSAO, PESSOAS_NOME`

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};