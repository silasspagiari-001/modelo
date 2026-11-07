'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const moment    = require('moment-timezone');
const codes = require('rescode');
const { exec } = require('child_process');
const axios = require('axios');

module.exports = {
    read: params => {		
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [15, 10, 15, 15],  // [15, 15, 15, 15]
			content: [
				{
					style: 'tableReport',
					table: {   //  3 etiquetas
						      //   1    2    3
						widths: [175, 175, 175],
						breakRows: false,
						body: []
					},
					style: {
						fontSize: 10
					}
				}
			],
			styles: {
				tableReport: {
					margin: [0, 0, 0, 0]
				}
			}
		};

        return new Promise((resolve, reject) => {
			api.etiquetas().readById(params.id, params)
				.then(async res => {

					let rows = docDefinition.content[0].table.body;
					let linhas = 0;
					let impressas = 0;
					let pathLogo;

					let etiquetas = res.results[0]['ETIQUETAS_ITENS'];
					let tipoEtiqueta = res.results[0]['TIPO'] || '';

					let viasEtiquetas = [];

						for(let i in etiquetas){ // cria um novo objeto com a quantidade exata de vias de cada etiqueta.

							let vias = etiquetas[i]['ETIQUETASITENS_QUANTIDADE'];
	
							for (let j = 0; j < vias; j++) {                         
								viasEtiquetas.push(etiquetas[i]);
							}
						}
	
						let registros = parseInt(viasEtiquetas.length) < 3 ? 3 : parseInt(viasEtiquetas.length);
						let j = 0, k = 0;
	                    let zpl = ''; // Início do ZPL

						for(let i = 0; i < registros; i += 3) {
	
							j = (parseInt(i) + 1);
							k = (parseInt(i) + 2);
	
							let idProdutoI  = i < viasEtiquetas.length ? 'Cod: ' + viasEtiquetas[i]['ETIQUETASITENS_ID_PRODUTOS'] : '';
							let idProdutoJ  = j < viasEtiquetas.length ? 'Cod: ' + viasEtiquetas[j]['ETIQUETASITENS_ID_PRODUTOS'] : '';
							let idProdutoK  = k < viasEtiquetas.length ? 'Cod: ' + viasEtiquetas[k]['ETIQUETASITENS_ID_PRODUTOS'] : '';
	
							let desProdutoI = idProdutoI ? viasEtiquetas[i]['PRODUTOS_NOME'].substring(0, 22) : '';
							let desProdutoJ = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_NOME'].substring(0, 22) : '';
							let desProdutoK = idProdutoK ? viasEtiquetas[k]['PRODUTOS_NOME'].substring(0, 22) : '';

							let desProdutoI1 = idProdutoI ? viasEtiquetas[i]['PRODUTOS_NOME'].substring(22, 43) : '';
							let desProdutoJ1 = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_NOME'].substring(22, 43) : '';
							let desProdutoK1 = idProdutoK ? viasEtiquetas[k]['PRODUTOS_NOME'].substring(22, 43) : '';

                            let desProdutoI2 = idProdutoI ? viasEtiquetas[i]['PRODUTOS_NOME'].substring(43, 65) : '';
							let desProdutoJ2 = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_NOME'].substring(43, 65) : '';
							let desProdutoK2 = idProdutoK ? viasEtiquetas[k]['PRODUTOS_NOME'].substring(43, 65) : '';

                            let precoI = '';
							let precoJ = '';
							let precoK = '';

                            if (idProdutoI) {
                                const precoOriginal = viasEtiquetas[i]['SALDOS_PRECO'];
                                const desconto = 0.18;
                                const precoComDesconto = precoOriginal * (1 - desconto);
                                precoI = `R$ ${utils.number.float2moeda(precoComDesconto)}`;
                            };
                            if (idProdutoJ) {
                                const precoOriginal = viasEtiquetas[j]['SALDOS_PRECO'];
                                const desconto = 0.18;
                                const precoComDesconto = precoOriginal * (1 - desconto);
                                precoJ = `R$ ${utils.number.float2moeda(precoComDesconto)}`;
                            };
                            if (idProdutoK) {
                                const precoOriginal = viasEtiquetas[k]['SALDOS_PRECO'];
                                const desconto = 0.18;
                                const precoComDesconto = precoOriginal * (1 - desconto);
                                precoK = `R$ ${utils.number.float2moeda(precoComDesconto)}`;
                            };

                            zpl += '^XA\n'; // Início do ZPL

                            if (idProdutoI) {
                                    const precoOriginal = viasEtiquetas[i]['SALDOS_PRECO'];
                                    const desconto = 0.18;
                                    const precoComDesconto = precoOriginal * (1 - desconto);
                                    zpl += `^FO50,20^A0,30^FD${idProdutoI}^FS\n`;
                                    zpl += `^FO46,55^A0,20^FD${desProdutoI}^FS\n`;
                                    zpl += `^FO46,80^A0,20^FD${desProdutoI1}^FS\n`;
                                    zpl += `^FO46,105^A0,20^FD${desProdutoI2}^FS\n`;
                                    zpl += `^FO50,140^A0,35^FD${precoI}^FS\n`;
                                    }            
                            if (idProdutoJ) {
                                    zpl += `^FO320,20^A0,30^FD${idProdutoJ}^FS\n`;
                                    zpl += `^FO316,55^A0,20^FD${desProdutoJ}^FS\n`;
                                    zpl += `^FO316,80^A0,20^FD${desProdutoJ1}^FS\n`;
                                    zpl += `^FO316,105^A0,20^FD${desProdutoJ2}^FS\n`;
                                    zpl += `^FO320,140^A0,35^FD${precoJ}^FS\n`;
                                }                                                    

                            if (idProdutoK) {
                                zpl += `^FO590,20^A0,30^FD${idProdutoK}^FS\n`;
                                zpl += `^FO586,55^A0,20^FD${desProdutoK}^FS\n`;
                                zpl += `^FO586,80^A0,20^FD${desProdutoK1}^FS\n`;
                                zpl += `^FO586,105^A0,20^FD${desProdutoK2}^FS\n`;
                                zpl += `^FO590,140^A0,35^FD${precoK}^FS\n`;

                            }

                            zpl += `^XZ\n`; // Fim da terceira etiqueta
                           
						}
	
                        sendZPL(zpl);

                        resolve('impressao ok');

				})


                .catch(res => {
                    resolve({name: `etiqueta.pdf`} );
				});
        });
    }
};

async function sendZPL(zpl) {
  try {
    const response = await axios.post(
      'https://unsibilant-nongelatinous-luke.ngrok-free.dev/print',
      zpl,
      {
        headers: {
          'X-Print-Token': 'SEU_TOKEN_AQUI',
          'Content-Type': 'text/plain'
        }
      }
    );
    console.log('Resposta do Print Agent:', response.data);
  } catch (error) {
    console.error('Erro ao enviar ZPL:', error.message);
  }
}