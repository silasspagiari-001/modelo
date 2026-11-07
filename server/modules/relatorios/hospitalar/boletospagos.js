'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const utils     = require('../../../services/samosUtils');
const samosFB   = require('../../../services/samosFB');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		const docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35], 
			content: [
				{columns: [{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {
						widths: [40, 20, 40, '*', 50],
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(95),
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
					],
					margin: [25, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 7,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 7,
					color: 'black'
				}
			}
		};

		return new Promise(async (resolve, reject) => {
            const sql = `select
                MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE,
                MOVIMENTOS_EMISSAO,
                MOVIMENTOS_NOME,
                MOVIMENTOS_TOTAL
            from MOVIMENTOS
            where MOVIMENTOS_ID_PRAZOS <> 1  and             /*PRAZO BOLETO*/
                  MOVIMENTOS_NFE       <> '' and             /*NAO É VTEX*/
                  MOVIMENTOS_NFE is not null and
                  MOVIMENTOS_STATUS    = 'N' and             /*BOLETO PAGO, MAS PEDIDO AINDA NAO EM SEPARACAO*/
                  MOVIMENTOS_EMISSAO > current_timestamp - 7 /*DOS ULTIMOS 7 DIAS*/`;

            const results = await samosFB.executeSQL(sql, params);

            let rows = docDefinition.content[1].table.body;

            let pathLogo;

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }

            rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 100,
                        height: 22,	
                        alignment: 'left',
                        border: [false, false, false, false]
                    },
                    { 
                        text: 'Relatório de Pedidos Pagos por Boleto',
                        colSpan: 4,
                        fontSize: 10,
                        alignment: 'center',
                        color: 'blue',
                        border: [false, false, false, false]
                    },{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        alignment: 'right',
                        border: [false, false, false, false]								
                    }
                ],
                [
                    {							
                        text: '',
                        alignment: 'left',
                        border: [false, false, false, false]
                    },
                    { 
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 4,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},
                    {
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        alignment: 'right',
                        border: [false, false, false, false]
                    }
                ]										
            );

            rows.push(											
                [
                    {
                        text: 'Número',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Série',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'
                    },								
                    {
                        text: 'Nome',
                        style: 'tableHeader',
                        alignment: 'center'
                    },				
                    {
                        text: 'Total',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]						
            )

            for(let i in results){
                rows.push([
                    {
                        text: results[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample',
                    },
                    {
                        text: results[i]['MOVIMENTOS_SERIE'],
                        alignment: 'center',
                        style: 'tableExample',
                    },
                    {
                        text: moment(results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample',
                    },							
                    {
                        text: results[i]['MOVIMENTOS_NOME'],
                        alignment: 'left',
                        style: 'tableExample',
                    },
                    {
                        text: utils.number.float2moeda(results[i]['MOVIMENTOS_TOTAL']),
                        alignment: 'right',
                        style: 'tableExample',
                    }
                ]);
            }

            pdfStream(docDefinition, resolve, reject);
        });
    }
};
