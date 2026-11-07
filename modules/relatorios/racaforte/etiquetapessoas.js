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
const samosFB = require('../../../services/samosFirebird');

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
	
						let registros = parseInt(viasEtiquetas.length) < 1 ? 1 : parseInt(viasEtiquetas.length);
						let j = 0, k = 0;
	                    let zpl = ''; // Início do ZPL

                        const db = await samosFB.conectarBanco(params.client); 

						for(let i = 0; i < registros; i += 1) {
	
	                        const dados = await obterDados(db, viasEtiquetas[i]['ETIQUETASITENS_ID_PESSOAS']);

                            let idProdutoI  = i < viasEtiquetas.length ? dados[0]['PESSOAS_NOME'] : '';
							let desProdutoI = idProdutoI ? dados[0]['PESSOAS_ENDERECOCOBRANCA'] + ',' + dados[0]['PESSOAS_NUMEROCOBRANCA'] : '';
							let desProdutoI1 = idProdutoI ? dados[0]['PESSOAS_BAIRROCOBRANCA'] : '';
				            let desProdutoI2 = idProdutoI ? dados[0]['PESSOAS_CEPCOBRANCA'] + ' ' + dados[0]['CIDADES_NOME'] + ',' + dados[0]['CIDADES_ESTADO'] : '';

                            zpl += '^XA\n'; // Início do ZPL
                            zpl += `^FO40,30^A0,40^FD${idProdutoI}^FS\n`;
                            zpl += `^FO40,90^A1,35^FD${desProdutoI}^FS\n`;
                            zpl += `^FO40,140^A1,35^FD${desProdutoI1}^FS\n`;
                            zpl += `^FO40,190^A1,35^FD${desProdutoI2}^FS\n`;
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
};

async function obterDados(db,params) {
    const sql = `SELECT PESSOAS_NOME, PESSOAS_ENDERECOCOBRANCA,
     PESSOAS_NUMEROCOBRANCA,
     PESSOAS_BAIRROCOBRANCA,
     PESSOAS_CEPCOBRANCA,
     CIDADES_NOME,
     CIDADES_ESTADO 
     FROM PESSOAS 
     left outer join CIDADES on CIDADES_ID  = PESSOAS_ID_CIDADESCOBRANCA
     WHERE PESSOAS_ID = ${params}
     `;

     return new Promise((resolve, reject) => {
          db.query(sql, (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });   
};