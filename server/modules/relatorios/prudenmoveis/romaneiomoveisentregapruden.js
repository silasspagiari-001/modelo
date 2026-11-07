'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const samosFB   = require('../../../services/samosFirebird');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [30, 20, 30, 20],  // Before: all 30
			content: [
				{columns: [{},{},{},{},{},{}]},
				{
					style: {
                        margin: [0, 0, 0, 0],
                    },
                    fontSize: 11, //     160  24
                    table: {   // 1   2    3   4   5   6   7   8   9
                        widths: [45, 65, 122, 62, 22, 40, 53, 35, 19],
						body: []
					}
				} 
            ],
			footer: function(page, pages) { 
				return { 
					stack: [ 
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [30, 10] // 40, 10
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

                    const pedidosFiltrados = (searchPedidos.results || []).filter(pedido => {
                        return pedido['ROMANEIOS_DOCUMENTO'] == 'Romaneio Entrega'
                    });
                    
                    const pedidos = romaneio['ROMANEIOS_ITENS'].map(item => {
                        return pedidosFiltrados.find(pedido => {
                            return pedido['MOVIMENTOS_ID'] == item['ROMANEIOSITENS_ID_MOVIMENTOS'];
                        });
                    });

                    let contadorPedidos = 0;
                    let contadorItens = 0;

                    title(rows, romaneio, false);

                    pedidos.forEach((pedido, index) => {
                        contadorPedidos++;

                        if((contadorItens > 10) || contadorPedidos > 3) {
                            contadorPedidos = 1;
                            contadorItens = 1;
                            title(rows, romaneio, true);
                        }

                        const itens = pedido['MOVIMENTOS_ITENS'];
                        const primeiroItem = itens && itens[0] ? itens[0] : {};
                        const dataEntrega = primeiroItem['MOVIMENTOSITENS_DATAENTREGA'] && primeiroItem['MOVIMENTOSITENS_DATAENTREGA'].toString ? primeiroItem['MOVIMENTOSITENS_DATAENTREGA'] : '';
                        const turnoEntrega = primeiroItem['MOVIMENTOSITENS_HORAENTREGA'] && primeiroItem['MOVIMENTOSITENS_HORAENTREGA'].toString ? primeiroItem['MOVIMENTOSITENS_HORAENTREGA'] : '';
                        let fantasia = pedido['EMPRESAS_FANTASIA'] || '';

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
                                        text: 'Agenda: ' + moment(dataEntrega).format('DD/MM/YYYY')
                                    }
                                ],
                                border: [true, true, true, true]
                            },
                            {
                                text: 'a',
                                color: 'white',
                                rowSpan: 2,
                                border: [false, true, false, false]
                            },
                            {
                                text: fantasia.indexOf('-') != -1 ? fantasia.split('-')[1] : '',
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
                                            turnoEntrega == 'M' ? 'Manhã' :
                                            turnoEntrega == 'T' ? 'Tarde' :
                                            turnoEntrega == 'N' ? 'Noite' : ''
                                        )
                                    }
                                ],
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
                                text: `${pedido['MOVIMENTOS_NOME']} ${pedido['PESSOAS_FANTASIA'].length > 0 ? ` (${pedido['PESSOAS_FANTASIA']})`: ''}(${pedido['MOVIMENTOS_ID_PESSOAS']})`,
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
                                text: 'Código',
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Descrição do Produto',
                                colSpan: 4,
                                border: [true, true, true, true],
                                alignment: 'center'
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
                                alignment: 'center'
                            }
                        ]);

                        let fanItem = '';
                        let sigItem = '';
    
                        itens.forEach(item => {

                            contadorItens++;
                            fanItem = item['EMPRESAS_FANTASIA'] || '';
                            sigItem = fanItem.indexOf('-') != -1 ? fanItem.split('-')[1] : ''

                            rows.push([
                                {
                                    text: item['MOVIMENTOSITENS_ID_PRODUTOS'],
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },
                                {
                                    text: (item['PRODUTOS_NOME'] || '').substr(0, 50),
                                    fontSize: 10,
                                    colSpan: 4,
                                    border: [true, true, true, true]
                                },{},{},{},
                                {
                                    text: item['PRODUTOS_MARCA'],
                                    fontSize: 10,                                    
                                    border: [true, true, true, true],
                                    colSpan: 2,
                                    alignment: 'center'
                                },{},
                                {
                                    text: item['MOVIMENTOSITENS_QUANTIDADE'],
                                    fontSize: 10,                                    
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },
                                {
                                    text: sigItem, // Sigla da Filial
                                    border: [true, true, true, true],
                                    fontSize: 10,                                    
                                    alignment: 'center'
                                }
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
                                text: 'A\n\n',
                                color: 'white',
                                fontSize: 5,
                                colSpan: 9,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{}
                        ]);	
                                               
                    });

/*                  Quando precisar, usar bloco abaixo, e mudar de samosFirebird para samosFB
                    console.log('Romaneio impresso: ', romaneio['ROMANEIOS_NUMERO']);
                    if(romaneio['ROMANEIOS_ID_EMPRESAS'] == 1) {
                        await gerarTransferenciasRomaneio(romaneio['ROMANEIOS_ID'], romaneio['ROMANEIOS_NUMERO'], params);
                    }            
*/
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};

const title = function(rows, romaneio, newPage) {

    let nomeCabecalho = '';
    let romPessoa = romaneio['ROMANEIOS_ID_PESSOAS'];
    let movPessoa = romaneio['ROMANEIOS_ITENS'][0]['MOVIMENTOS_ID_PESSOAS'];
    let foiRetirado = (romPessoa == movPessoa);

    if(foiRetirado) {
        nomeCabecalho = 'CLIENTE RETIROU';
    } else {
        nomeCabecalho = romaneio['PESSOAS_NOME'];
    }

    if(newPage) {
        rows.push([
            {
                text: 'ROMANEIO\n',
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
                text: 'ROMANEIO\n',
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
            text: moment(romaneio['ROMANEIOS_EMISSAO']).format('DD/MM/YYYY') + '   N° ' + romaneio['ROMANEIOS_NUMERO'],
            border: [false, false, false, false],
            italics: true,
            colSpan: 2
        },{},
        {
            text: (foiRetirado ? '' : 'Valor: ' + utils.number.float2moeda(romaneio['ROMANEIOS_FRETE'])),
            border: [false, false, false, false],
            colSpan: 2,
            alignment: 'center'
        },{},
        {
            text: nomeCabecalho,
            fontSize: (nomeCabecalho.length > 30 ? 7.5 : 10),
            border: [false, false, false, false],
            alignment: 'right',
            colSpan: 5
        },{},{},{},{}
    ]);
};

const listarPartidas = function(movimento) {

    const produtos          = movimento['MOVIMENTOS_ITENS'] || [];
    const totalPartida      = cents(movimento['MOVIMENTOS_IMPOSTO']);
    const totalMovimento    = cents(movimento['MOVIMENTOS_TOTAL']);
    const partidaPercentual = Math.round(((totalPartida / totalMovimento) * 100), 2);
    let somaPartidas        = 0

    produtos.forEach(produto => {

        const totalLiquido = cents(produto['TOTAL_LIQUIDO']);
        const partidaItem = Math.round((totalLiquido * (partidaPercentual / 100)), 2);

        if(totalLiquido == totalMovimento){  // Um item só
            produto['MOVIMENTOSITENS_IMPOSTO'] = (totalPartida / 100);
            somaPartidas = totalPartida;
        } else { 
            produto['MOVIMENTOSITENS_IMPOSTO'] = (partidaItem / 100);
            somaPartidas += partidaItem;
        }

    });

    if(somaPartidas > totalPartida) { // sobra
        const diferenca = (somaPartidas - totalPartida);
        produtos[0]['MOVIMENTOSITENS_IMPOSTO'] = (produtos[0]['MOVIMENTOSITENS_IMPOSTO'] - (diferenca / 100));
    } else if(somaPartidas < totalPartida) { // falta
        const diferenca = (totalPartida - somaPartidas);
        produtos[0]['MOVIMENTOSITENS_IMPOSTO'] = (produtos[0]['MOVIMENTOSITENS_IMPOSTO'] + (diferenca / 100));        
    }

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

// Bloco inserido temporariamente, até o final...
async function gerarTransferenciasRomaneio(idRomaneio, numRomaneio, params) {
    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');

    const transferencias = await getTransferencias(idRomaneio, params);

    if(transferencias.length == 0) { return; }
    
    // Gera as transferências da loja 2 a 9      
    for (let transfEmpresa = 2; transfEmpresa < 10; transfEmpresa++) {
        const transferenciasLoja = transferencias.filter(loja => {
            return loja['MOVIMENTOS_ID_EMPRESAS'] == transfEmpresa;
        });

        if(transferenciasLoja.length > 0) {
            // Passo 1 - Gera a TRE na Loja
            const produtosLoja = await geraProdutos(transferenciasLoja, 800000);
            const totalProdutosLoja = produtosLoja.reduce((tot, produto) => {
                return tot += utils.number.cents(produto['MOVIMENTOSITENS_TOTAL']);
            }, 0) / 100;

            const transferenciaEntrada = {
                'MOVIMENTOS_ID_PESSOAS'   : 1,
                'MOVIMENTOS_NOME'         : 'PRUDEN MÓVEIS - CD',
                'MOVIMENTOS_SERIE'        : 'TRE',
                'MOVIMENTOS_CPFCNPJ'      : '74398579000200',
                'MOVIMENTOS_EMAIL'        : 'prudenmoveis@prudenmoveis.com.br',
                'MOVIMENTOS_ID_EMPRESAS'  : transfEmpresa,
                'MOVIMENTOS_ID_DOCUMENTOS': transfEmpresa + '0016',
                'DOCUMENTOS_NOME'         : 'Transferências Entrada',
                'MOVIMENTOS_ID_OPERACOES' : 800000,
                'MOVIMENTOS_ID_PRAZOS'    : 1,
                'MOVIMENTOS_ID_USUARIOS'  : params.userId,
                'MOVIMENTOS_STATUS'       : 'F',
                'MOVIMENTOS_SITUACAO'     : 0,
                'MOVIMENTOS_PRODUTOS'     : totalProdutosLoja,
                'MOVIMENTOS_TOTAL'        : totalProdutosLoja,
                'MOVIMENTOS_IMPOSTO'      : 0,
                'MOVIMENTOS_FRETE'        : 0,
                'MOVIMENTOS_DESCONTOS'    : 0,
                'MOVIMENTOS_PERCENTUAL'   : 0,
                'MOVIMENTOS_SEGURO'       : 0,
                'MOVIMENTOS_DESPESAS'     : 0,
                'MOVIMENTOS_MARGEM'       : 0,
                'MOVIMENTOS_OBSERVACOES'  : 'ROM: ' + numRomaneio + '|||||||||',
                'MOVIMENTOS_EMISSAO'      : hoje,
                'MOVIMENTOS_ENTRADASAIDA' : hoje,
                'MOVIMENTOS_ITENS'        : produtosLoja
            }

            await api.movimentos().create(transferenciaEntrada, params);

            // Passo 2 - Gera a TRS no CD.     
            const produtosCD = await geraProdutos(transferenciasLoja, 700000);
            const totalProdutosCD = produtosCD.reduce((tot, produto) => {
                return tot += utils.number.cents(produto['MOVIMENTOSITENS_TOTAL']);
            }, 0) / 100;

            const transferenciaSaida = {
                'MOVIMENTOS_ID_PESSOAS'   : transfEmpresa,
                'MOVIMENTOS_NOME'         : produtosCD[0]['EMPRESAS_FANTASIA'],
                'MOVIMENTOS_SERIE'        : 'TRS',                        
                'MOVIMENTOS_CPFCNPJ'      : produtosCD[0]['EMPRESAS_CPFCNPJ'],
                'MOVIMENTOS_EMAIL'        : 'prudenmoveis@prudenmoveis.com.br',
                'MOVIMENTOS_ID_EMPRESAS'  : 1,
                'MOVIMENTOS_ID_DOCUMENTOS': '10007',
                'DOCUMENTOS_NOME'         : 'Transferências Saída',
                'MOVIMENTOS_ID_OPERACOES' : 700000,
                'MOVIMENTOS_ID_PRAZOS'    : 1,
                'MOVIMENTOS_ID_USUARIOS'  : params.userId,
                'MOVIMENTOS_STATUS'       : 'F',
                'MOVIMENTOS_SITUACAO'     : 0,
                'MOVIMENTOS_PRODUTOS'     : totalProdutosCD,
                'MOVIMENTOS_TOTAL'        : totalProdutosCD,
                'MOVIMENTOS_IMPOSTO'      : 0,
                'MOVIMENTOS_FRETE'        : 0,
                'MOVIMENTOS_DESCONTOS'    : 0,
                'MOVIMENTOS_PERCENTUAL'   : 0,
                'MOVIMENTOS_SEGURO'       : 0,
                'MOVIMENTOS_DESPESAS'     : 0,
                'MOVIMENTOS_MARGEM'       : 0,
                'MOVIMENTOS_OBSERVACOES'  : 'ROM: ' + numRomaneio + '|||||||||',
                'MOVIMENTOS_EMISSAO'      : hoje,                        
                'MOVIMENTOS_ENTRADASAIDA' : hoje,
                'MOVIMENTOS_ITENS'        : produtosCD
            }

            await api.movimentos().create(transferenciaSaida, params);
        }
    }
};

async function getTransferencias(idRomaneio, params) {
    return await samosFB.executeSQL(`select 
        ROMANEIOSITENS_ID, 
        ROMANEIOSITENS_ID_MOVIMENTOS,
        MOVIMENTOSITENS_ID_EMPRESAS, 
        MOVIMENTOSITENS_ID_PRODUTOS, 
        MOVIMENTOS_ID_EMPRESAS,
        MOVIMENTOSITENS_QUANTIDADE, 
        SALDOS_CUSTO, 
        EMPRESAS_FANTASIA, 
        EMPRESAS_CPFCNPJ
    from ROMANEIOSITENS
    join MOVIMENTOS      on MOVIMENTOS_ID                 = ROMANEIOSITENS_ID_MOVIMENTOS   
    join MOVIMENTOSITENS on MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID
    join EMPRESAS        on EMPRESAS_ID                   = MOVIMENTOS_ID_EMPRESAS                                             
    join SALDOS          on SALDOS_ID_EMPRESAS            = MOVIMENTOS_ID_EMPRESAS and 
                            SALDOS_ID_PRODUTOS            = MOVIMENTOSITENS_ID_PRODUTOS
    where ROMANEIOSITENS_ID_ROMANEIOS = ${idRomaneio}
    and MOVIMENTOSITENS_ID_EMPRESAS = 1 `, params);
}

async function geraProdutos(transferenciasLoja, operacao) {
    return transferenciasLoja.map((produto, index) => {
        return {
            'MOVIMENTOSITENS_ID'          : (index + 1) * -1,
            'MOVIMENTOSITENS_ID_EMPRESAS' : produto['MOVIMENTOSITENS_ID_EMPRESAS'],
            'EMPRESAS_FANTASIA'           : produto['EMPRESAS_FANTASIA'],
            'EMPRESAS_CPFCNPJ'            : produto['EMPRESAS_CPFCNPJ'],
            'MOVIMENTOSITENS_ID_PRODUTOS' : produto['MOVIMENTOSITENS_ID_PRODUTOS'],
            'MOVIMENTOSITENS_QUANTIDADE'  : produto['MOVIMENTOSITENS_QUANTIDADE'],
            'MOVIMENTOSITENS_PRECO'       : produto['SALDOS_CUSTO'],
            'MOVIMENTOSITENS_CUSTO'       : produto['SALDOS_CUSTO'],
            'MOVIMENTOSITENS_PERCENTUAL'  : 0,
            'MOVIMENTOSITENS_DESCONTOS'   : 0,
            'MOVIMENTOSITENS_FRETE'       : 0,
            'MOVIMENTOSITENS_SEGURO'      : 0,
            'MOVIMENTOSITENS_DESPESAS'    : 0,
            'MOVIMENTOSITENS_IMPOSTO'     : 0,
            'MOVIMENTOSITENS_ENTREGUE'    : 0,
            'MOVIMENTOSITENS_DEPOSITO'    : 0,
            'MOVIMENTOSITENS_IMEDIATA'    : 0,
            'MOVIMENTOSITENS_TOTAL'       : (
                utils.number.cents(produto['SALDOS_CUSTO']) * produto['MOVIMENTOSITENS_QUANTIDADE']
            ) / 100,
            'MOVIMENTOSITENS_ID_OPERACOES': operacao
        }
    })
}
// Aqui é o final..