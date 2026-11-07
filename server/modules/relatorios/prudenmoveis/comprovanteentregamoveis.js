'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const samosFB   = require('../../../services/samosFirebird');
const moment    = require('moment-timezone');

const codes = require('rescode');
codes.loadModules(['qrcode']);

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
                    fontSize: 8, 
                    table: {
						widths: [45, 65, 150, 39, 17, 40, 53, 35, 19],
						body: []
					}
				} 
			]
		};

        return new Promise((resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(async res => {
                    const rows = docDefinition.content[1].table.body;
                    const pedidos = (res.results || []).filter(pedido => {
                        return pedido['ROMANEIOS_DOCUMENTO'] != 'Romaneio Montagem'
                    });

                    const qrcodes  = await getQrcode(pedidos);

                    let contadorPedidos = 0;
                    let contadorItens = 0;
                                   
                    title(rows);

                    pedidos.forEach((pedido, index) => {
                        contadorPedidos++;

                        const itens = pedido['MOVIMENTOS_ITENS'];
                        const primeiroItem = itens && itens[0] ? itens[0] : {};
                        const dataEntrega = primeiroItem['MOVIMENTOSITENS_DATAENTREGA'] && primeiroItem['MOVIMENTOSITENS_DATAENTREGA'].toString ? primeiroItem['MOVIMENTOSITENS_DATAENTREGA'] : '';
                        const turnoEntrega = primeiroItem['MOVIMENTOSITENS_HORAENTREGA'] && primeiroItem['MOVIMENTOSITENS_HORAENTREGA'].toString ? primeiroItem['MOVIMENTOSITENS_HORAENTREGA'] : '';
                        const fantasia = pedido['EMPRESAS_FANTASIA'];
                        const status = pedido['ROMANEIOS_STATUS'];

                        rows.push([
                            {
                                text: [
                                    {

                                        text: 'SOLICITAÇÃO\n DE ENTREGA',
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
                                        text: 'Agenda: ' + moment(dataEntrega).format('DD/MM/YYYY'),
                                        fontSize: 10,
                                    }
                                ],
                                border: [true, true, true, true]
                            },
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
                                        text: pedido['MOVIMENTOS_NUMERO'],
                                        fontSize: 25,
                                        bold: true
                                    }
                                ],
                                alignment: 'center',
                                rowSpan: 2,
                                colSpan: 4,
                                border: [true, true, true, true]
                            },
                            {},{},{}
                        ]);
    
                        rows.push([
                            {},{},
                            {
                                text: [
                                    {
                                        text: 'Turno: ' + (
                                            turnoEntrega == 'M' ? 'Manhã' :
                                            turnoEntrega == 'T' ? 'Tarde' :
                                            turnoEntrega == 'N' ? 'Noite' : ''
                                        )
                                    }
                                ],
                                fontSize: 10,
                                border: [true, true, true, true]
                            },{},{},{},{},{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Nome',
                                border: [true, true, true, true]
                            },
                            {
                                text: pedido['MOVIMENTOS_NOME'] + (pedido['PESSOAS_FANTASIA'].length > 0 ? ` (${pedido['PESSOAS_FANTASIA']})`: '') + '(' + pedido['MOVIMENTOS_ID_PESSOAS'] + ') ',
                                colSpan: 4,
                                border: [true, true, true, true],
                            },{},{},{},
                            {
                                text: 'Celular',
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
                                border: [true, true, true, true]
                            },
                            {
                                text: pedido['PESSOAS_ENDERECO'] + ', ' + pedido['PESSOAS_NUMERO'],
                                colSpan: 4,
                                border: [true, true, true, true]
                            },{},{},{},
                            {
                                text: 'Telefone',
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
                                border: [true, true, true, true]
                            },
                            {
                                text: pedido['PESSOAS_BAIRRO'],
                                colSpan: 4,
                                border: [true, true, true, true]
                            },{},{},{},
                            {
                                text: 'Cidade',
                                border: [true, true, true, true]
                            },
                            {
                                text: (pedido['CIDADES_NOME'] || '').replace('PRESIDENTE ', 'PRES. ')
                                                                    .replace('ALVARES ', 'ALV. ')
                                                                    .replace('ÁLVARES ', 'ALV. ')
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
                                border: [true, true, true, true]
                            },{
                                text: pedido['PESSOAS_PAGINA'].toUpperCase(),
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
                                border: [false, true, false, true]
                            },{},{},{},{},{},{},{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Código',
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Descrição do Produto',
                                colSpan: 2,
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{},
                            {
                                text: 'Cor',
                                colSpan: 2,
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{},
                            {
                                text: 'Qtde',
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Filial',
                                colSpan: 3,
                                border: [true, true, true, true],
                                alignment: 'center',
                            },{},{}
                        ]);
    
                        itens.forEach(item => {
                            contadorItens++;

                            const descriProduto = item['PRODUTOS_NOME'];

                            rows.push([
                                {
                                    text: item['MOVIMENTOSITENS_ID_PRODUTOS'],
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },
                                {
                                    text: descriProduto,
                                    font: 'Consolas',	
                                    fontSize: descriProduto.length > 50 ? 6 : 8,
                                    colSpan: 2,
                                    border: [true, true, true, true]
                                },{},
                                {
                                    text: item['PRODUTOS_MARCA'],
                                    colSpan: 2,
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },{},
                                {
                                    text: item['MOVIMENTOSITENS_QUANTIDADE'],
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },
                                {
                                    text: item['EMPRESAS_FANTASIA'],
                                    colSpan: 3,
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },{},{}
                            ]);
                        });
    
                        rows.push([
                            {
                                text: 'ESTOU CIENTE QUE ESPELHOS, VIDROS E PEDRAS, DEVEM SER CONFERIDOS NESTE ATO, POR SEREM ITENS FRÁGEIS AO MANUSEIO\nRECEBI E CONFERI OS PRODUTOS CONSTANTES DA SOLICITAÇÃO DE ENTREGA ACIMA, ESTANDO TODOS EM PERFEITAS CONDIÇÕES',
                                border: [true, true, true, true],
                                fontSize: 8.7,
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
                                image: 'data:image/png;base64,' + qrcodes[index],
                                width: 50,
                                height: 50,
                                colSpan: 9,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{}
                        ]);
                        
                        rows.push([
                            {
                                text: (completeChars(pedido['MOVIMENTOS_ID_EMPRESAS'], 2) + completeChars(pedido['MOVIMENTOS_NUMERO'], 6)).split('').join(' '),
                                bold: true,
                                colSpan: 9,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{}
                        ]);
                        
                        rows.push([
                            {
                                text: 'Valor Partida',
                                border: [false, false, false, false],
                                colSpan: 2
                            },{},
                            {
                                text: utils.number.float2moeda(pedido['MOVIMENTOS_IMPOSTO']),
                                border: [false, false, false, false],
                                bold: true
                            },
                            {
                                text: 'Visto Gerente _________________________________________',
                                border: [false, false, false, false],
                                colSpan: 6
                            },
                            {},{},{},{},{}
                        ]);	
    
                        rows.push([
                            {
                                text: 'A\n',
                                color: 'white',
                                fontSize: 5,
                                colSpan: 9,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{}
                        ]);	

                        if(contadorPedidos == 1) {
                            const proximoPedido = pedidos[index + 1];

                            if(proximoPedido && contadorItens + proximoPedido['MOVIMENTOS_ITENS'].length > 13) {
                                //pular um bloco e pular para próxima pagina
                                const linhasRestantes = 13 - contadorItens;

                                const text = Array.from({length: parseInt(linhasRestantes * 1.5)}, (v, k) => k).reduce((str, index) => {
                                    return str + '\n';
                                }, 'A');

                                rows.push([
                                    {
                                        text: text,
                                        color: 'white',
                                        fontSize: 9,
                                        colSpan: 9,
                                        border: [false, false, false, false]
                                    },{},{},{},{},{},{},{},{}
                                ]);	

                                rows.push([
                                    {
                                        text: 'A\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n',
                                        color: 'white',
                                        fontSize: 7,
                                        colSpan: 9,
                                        border: [false, false, false, false]
                                    },{},{},{},{},{},{},{},{}
                                ]);	

                                title(rows);

                                contadorPedidos = 0;
                                contadorItens   = 0;
                            }
                        } else if(contadorPedidos == 2) {
                            //pular para próxima pagina
                            const proximoPedido = pedidos[index + 1];
                            const linhasRestantes = 13 - contadorItens;

                            const text = Array.from({length: linhasRestantes}, (v, k) => k).reduce((str, index) => {
                                return str + '\n';
                            }, 'A');

                            rows.push([
                                {
                                    text: linhasRestantes ? text : '',
                                    color: 'white',
                                    fontSize: 10,
                                    colSpan: 9,
                                    border: [false, false, false, false]
                                },{},{},{},{},{},{},{},{}
                            ]);	

                            if(proximoPedido){
                                title(rows);
                            }

                            contadorPedidos = 0;
                            contadorItens   = 0;
                        }

                        atualizaStatusImpressao(pedido['MOVIMENTOS_ID'], params);

                    });

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};

const title = function(rows) {
    rows.push([
        {
            text: 'COMPROVANTE DE ENTREGA\n',
            fontSize: 18, 
            border: [false, false, false, false],
            bold: true,
            colSpan: 9,
            color: 'red',
            alignment: 'center'
        },{},{},{},{},{},{},{},{}
    ]);

    rows.push([
        {
            text: 'A',
            color: 'white',
            fontSize: 2,
            colSpan: 9,
            border: [false, false, false, false],
            bold: true
        },{},{},{},{},{},{},{},{}
    ]);
};

const getQrcode = function(pedidos) {
    return new Promise((resolve, reject) => {
        const qrcodes = pedidos.map(pedido => {
            const code = completeChars(pedido['MOVIMENTOS_ID_EMPRESAS'], 2) + completeChars(pedido['MOVIMENTOS_NUMERO'], 6);
            return codes.create('qrcode', code).toString("base64");
        });

        resolve(qrcodes);
    });
};

const completeChars = function (str, chars, char = '0', direction = 'left') {
    var str = (str && str.toString) ? str.toString() : '',
        nCharsToComplete = chars - str.length;

    for (var i = 0; i < nCharsToComplete; i++) {
        if(direction == 'left'){
            str = char + str;
        } else if(direction == 'right'){
            str = str + char;
        } 
    }

    return str;
};

const atualizaStatusImpressao = function(pedido, params) {
    return new Promise(async (resolve, reject) => {
        const db = await samosFB.conectarBancoAsync(params.client);

        await db.query(`update MOVIMENTOS set MOVIMENTOS_PROTOCOLO = 'ENTREGA' 
                                            where MOVIMENTOS_ID = ${pedido}`);
    });
};