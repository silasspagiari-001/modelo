'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [30, 30, 30, 30],
			content: [
				{columns: [{},{},{},{},{},{}]},
				{
					style: {
                        margin: [0, 0, 0, 0],
                    },
                    fontSize: 11, 
                    table: {
						widths: [45, 65, 160, 24, 22, 40, 53, 35, 19],
						body: []
					}
				} 
			],
			footer: function(page, pages) { 
				return { 
					stack: [ 
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			}
		};

        return new Promise((resolve, reject) => { 
			api.romaneiosmoveis().readById(params.id, params)
				.then(async res => {
                    const rows = docDefinition.content[1].table.body;
                    const romaneio = res.results && res.results[0] ? res.results[0] : undefined;
                    const searchPedidos = await api.movimentos().readById(romaneio['ROMANEIOS_ITENS'].reduce((ids, pedido) => {
                        ids += pedido['ROMANEIOSITENS_ID_MOVIMENTOS'] + ',';
                        return ids;
                    }, '').slice(0, -1), params);

                    const todosPedidos = searchPedidos.results;

                    const pedidos = todosPedidos.filter(pedido => pedido['ROMANEIOS_DOCUMENTO'] == 'Romaneio Montagem');

                    let contadorPedidos = 0;
                    let contadorItens = 0;
                                   
                    title(rows, romaneio);

                    pedidos.forEach(pedido => {
                        contadorPedidos++;

                        if((contadorItens > 10) || contadorPedidos > 3) {
                            contadorPedidos = 1;
                            contadorItens = 1;
                            title(rows, romaneio, true);
                        }

                        const itens = pedido['MOVIMENTOS_ITENS'];
                        const primeiroItem = itens && itens[0] ? itens[0] : {};
                        const dataMontagem = primeiroItem['MOVIMENTOSITENS_DATAMONTAGEM'] && primeiroItem['MOVIMENTOSITENS_DATAMONTAGEM'].toString ? primeiroItem['MOVIMENTOSITENS_DATAMONTAGEM'] : '';
                        const turnoMontagem = primeiroItem['MOVIMENTOSITENS_HORAMONTAGEM'] && primeiroItem['MOVIMENTOSITENS_HORAMONTAGEM'].toString ? primeiroItem['MOVIMENTOSITENS_HORAMONTAGEM'] : '';
                        const fantasia = pedido['EMPRESAS_FANTASIA'];

                        rows.push([
                            {
                                text: [
                                    {
                                        text: 'SOLICITAÇÃO\n DE MONTAGEM',
                                        fontSize: 12
                                    }
                                ],
                                color: 'darkblue',
                                bold: true,
                                alignment: 'center',
                                colSpan: 2,
                                rowSpan: 2,
                                border: [true, true, true, true]
                            },{},
                            {
                                text: [
                                    {
                                        text: 'Agenda: ' + moment(dataMontagem).format('DD/MM/YYYY'),
                                        fontSize: 10
                                    }
                                ],
                                colSpan: 2,
                                bold: true,
                                fontSize: 12,
                                border: [true, true, true, true]
                            },{},
                            {
                                text: fantasia.indexOf('-') != -1 ? fantasia.slice(fantasia.indexOf('-') + 2, Infinity) : fantasia.slice(0, 2),
                                alignment: 'center',
                                fontSize: 25,
                                bold: true,
                                colSpan: 2,
                                rowSpan: 2,
                                border: [true, true, true, true]
                            },{},
                            {
                                text: [
                                    {
                                        text: 'Ordem do Serviço\n',
                                        fontSize: 9
                                    },
                                    {
                                        text: pedido['MOVIMENTOS_NUMERO'],
                                        fontSize: 15
                                    }
                                ],
                                bold: true,
                                alignment: 'center',
                                rowSpan: 2,
                                colSpan: 3,
                                border: [true, true, true, true]
                            },{},{}
                        ]);
    
                        rows.push([
                            {},{},
                            {
                                text: [
                                    {
                                        text: 'Turno: ' + (
                                            turnoMontagem == 'M' ? 'Manhã' :
                                            turnoMontagem == 'T' ? 'Tarde' :
                                            turnoMontagem == 'N' ? 'Noite' : ''
                                        )
                                    }
                                ],
                                colSpan: 2,
                                fontSize: 10,
                                border: [true, true, true, true]
                            },{},{},{},{},{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Nome',
                                fontSize: 9,                                
                                border: [true, true, true, true]
                            },
                            {
                                text: pedido['MOVIMENTOS_NOME'] + (pedido['PESSOAS_FANTASIA'].length > 0 ? ` (${pedido['PESSOAS_FANTASIA']})`: ''),
                                colSpan: 4,
                                border: [true, true, true, true]
                            },{},{},{},
                            {
                                text: 'Celular',
                                fontSize: 9,                                
                                border: [true, true, true, true]
                            },
                            {
                                text: utils.string.maskFone(pedido['MOVIMENTOS_CELULAR']),
                                colSpan: 3,
                                border: [true, true, true, true]
                            },{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Endereço',
                                fontSize: 9,
                                border: [true, true, true, true]
                            },
                            {
                                text: pedido['PESSOAS_ENDERECO'] + ', ' + pedido['PESSOAS_NUMERO'],
                                colSpan: 4,
                                border: [true, true, true, true]
                            },{},{},{},
                            {
                                text: 'Telefone',
                                fontSize: 9,                                
                                border: [true, true, true, true]
                            },
                            {
                                text: utils.string.maskFone(pedido['PESSOAS_TELEFONE']),
                                colSpan: 3,
                                border: [true, true, true, true]
                            },{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Bairro',
                                fontSize: 9,                                
                                border: [true, true, true, true]
                            },
                            {
                                text: pedido['PESSOAS_BAIRRO'],
                                colSpan: 4,
                                border: [true, true, true, true]
                            },{},{},{},
                            {
                                text: 'Cidade',
                                fontSize: 9,                                
                                border: [true, true, true, true]
                            },
                            {
                                text: (pedido['CIDADES_NOME'] || '').replace('PRESIDENTE ', 'PRES. ')
                                                                    .replace('ALVARES ', 'ALV. ')
                                                                    .replace('ALFREDO ', 'ALF. ')
                                                                    .replace('SANTO ', 'STO. '),
                                colSpan: 2,
                                border: [true, true, true, true]
                            },{},
                            {
                                text: pedido['CIDADES_ESTADO'],
                                border: [true, true, true, true]
                            }
                        ]);
    
                        rows.push([
                            {
                                text: 'Obs',
                                fontSize: 9,                                
                                border: [true, true, true, true]
                            },{
                                text: pedido['PESSOAS_PAGINA'],
                                colSpan: 8,
                                border: [true, true, true, true],
                            },{},{},{},{},{},{},{}
                        ]);

                        rows.push([
                            {
                                text: 'A',
                                color: 'white',
                                fontSize: 2,
                                colSpan: 9,
                                border: [false, true, false, true],
                                bold: true
                            },{},{},{},{},{},{},{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Código',
                                border: [true, true, true, true],
                                alignment: 'center',
                            },
                            {
                                text: 'Descrição do Produto',
                                colSpan: 4,
                                border: [true, true, true, true],
                                alignment: 'center',
                            },{},{},{},
                            {
                                text: 'Cor',
                                border: [true, true, true, true],
                                alignment: 'center',
                                colSpan: 2
                            },{},
                            {
                                text: 'Qtde',
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Fil',
                                border: [true, true, true, true],
                                alignment: 'center',
                            }
                        ]);
    
                        let fanItem = '';
                        let sigItem = '';

                        itens.forEach(item => {

                            if(item['MONTAGENS_VALOR'] > 0 && item['MOVIMENTOSITENS_CSTPIS'] != 'ML') {
                                contadorItens++;
                                fanItem = item['EMPRESAS_FANTASIA'];
                                sigItem = fanItem.indexOf('-') != -1 ? fanItem.slice(fanItem.indexOf('-') + 2, Infinity) : fanItem.slice(0, 2);    
                                rows.push([
                                    {
                                        text: item['MOVIMENTOSITENS_ID_PRODUTOS'],
                                        border: [true, true, true, true],
                                        alignment: 'center'
                                    },
                                    {
                                        text: (item['PRODUTOS_NOME'] || '').substr(0, 50),
                                        colSpan: 4,
                                        fontSize: 9,
                                        border: [true, true, true, true]
                                    },{},{},{},
                                    {
                                        text: item['PRODUTOS_MARCA'],
                                        border: [true, true, true, true],
                                        fontSize: 9,
                                        colSpan: 2,
                                        alignment: 'center'
                                    },{},
                                    {
                                        text: item['MOVIMENTOSITENS_QUANTIDADE'],
                                        border: [true, true, true, true],
                                        fontSize: 10,
                                        alignment: 'center'
                                    },
                                    {
                                        text: sigItem, // Sigla da Filial
                                        border: [true, true, true, true],
                                        fontSize: 10,                                    
                                        alignment: 'center'
                                    }    
                                ]);    
                            }
                        });
    
                        rows.push([
                            {
                                text: 'RECEBI E CONFERI A MONTAGEM DOS PRODUTOS CONSTANTES DA SOLICITAÇÃO DE MONTAGEM ACIMA EM PERFEITAS CONDIÇÕES',
                                border: [true, true, true, true],
                                fontSize: 8,
                                colSpan: 9
                            },{},{},{},{},{},{},{},{}
                        ]);

                        rows.push([
                            {
                                text: 'DATA DO RECEBIMENTO\n\n\n',
                                border: [true, true, true, true],
                                fontSize: 9,
                                colSpan: 2
                            },{},
                            {
                                text: 'IDENTIFICAÇÃO\n\n\n',
                                border: [true, true, true, true],
                                fontSize: 9,
                            },
                            {
                                text: 'ASSINATURA DO RECEBEDOR POR EXTENSO\n\n\n',
                                border: [true, true, true, true],
                                fontSize: 9,
                                colSpan: 6
                            },{},{},{},{},{}
                        ]);
                            
                        rows.push([
                            {
                                text: 'A\n\n',
                                color: 'white',
                                fontSize: 5,
                                colSpan: 9,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{}
                        ]);	
    
                    });

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};

const title = function(rows, romaneio, newPage) {

    if(newPage) {
        rows.push([
            {
                text: 'ROMANEIO DE MONTAGEM\n',
                pageBreak: 'before',
                fontSize: 18, 
                border: [false, false, false, false],
                bold: true,
                colSpan: 9,
                color: 'red',
                alignment: 'center'
            },{},{},{},{},{},{},{},{}
        ]);    
    } else {
        rows.push([
            {
                text: 'ROMANEIO DE MONTAGEM\n',
                fontSize: 18, 
                border: [false, false, false, false],
                bold: true,
                colSpan: 9,
                color: 'red',
                alignment: 'center'
            },{},{},{},{},{},{},{},{}
        ]);    
    }

    rows.push([
        {
            text: 'A',
            color: 'white',
            fontSize: 2,
            colSpan: 9,
            border: [false, false, false, false]
        },{},{},{},{},{},{},{},{}
    ]);

    rows.push([
        {
            text: romaneio['ROMANEIOS_EMISSAO'].split('-').reverse().join('/') + '   N° ' + romaneio['ROMANEIOS_NUMERO'],
            border: [false, false, false, false],
            italics: true,
            colSpan: 2
        },{},
        {
            text: 'Valor: ' + utils.number.float2moeda(romaneio['ROMANEIOS_FRETE']),
            border: [false, false, false, false],
            alignment: 'center'
        },
        {
            text: romaneio['PESSOAS_NOME'],
            border: [false, false, false, false],
            alignment: 'right',
            colSpan: 6
        },{},{},{},{},{}
    ]);
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
}