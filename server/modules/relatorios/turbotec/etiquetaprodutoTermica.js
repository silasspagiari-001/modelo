'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');

const codes = require('rescode');
codes.loadModules(["ean2", "ean5", "ean8", "ean13"]);

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: {width: 290, height: 'auto'},//'A6',  // 105 × 148 mm
			pageMargins: [10, 2, 2, 2],
			content: [
				{
					table: {  
						widths: [264], // 264 Uma coluna apenas
						body: []
					}
				}
			]
		};

        return new Promise((resolve, reject) => {
			api.etiquetas().readById(params.id, params)
				.then(async res => {
					let rows = docDefinition.content[0].table.body;
					const itens = res.results[0]['ETIQUETAS_ITENS'];
					let pathLogo;
					try {
						pathLogo = utils.client.getImagePath(`logos/etiqueta/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/etiqueta/default.png`;
					}

					for(let i in itens){

						const vias = (itens[i]['ETIQUETASITENS_QUANTIDADE'] || 1);
						let barraProduto   = utils.string.onlyNumbers(itens[i]['PRODUTOS_BARRA']);
						let codProduto     =    itens[i]['ETIQUETASITENS_ID_PRODUTOS'].toString();
						let codBarProduto  = isBarraGerada(codProduto, barraProduto) ? await getBarCode(barraProduto) : '';
						let lfNome         = itens[i]['PRODUTOS_NOME'].length > 30 ? '' : '\n\n'

						for (let v = 0; v < vias; v++) {
							rows.push([
								{
									border: [true, true, true, false],
									table: {
										widths: [190, '*'],										
										body: [
											[
												{
													image: `${pathLogo}`,
													width: 40,
													height: 25, // 20
													alignment: 'left',
													border: [false, false, false, false]
												},			
												codBarProduto ? {
														image: 'data:image/png;base64,' + codBarProduto,
														width: 55,
														height: 25, // 20
														alignment: 'right',
														border: [false, false, false, false]
												} : { text: '\n\n', color: 'white', border: [false, true, true, false]}																	
											]
										]
									},
									layout: 'noBorders'									
								}
							]);
							rows.push([
								{
									text: `${itens[i]['PRODUTOS_NOME']}${lfNome}`,
									font: 'Mercenary',
									fontSize: 30,
									alignment: 'left',
									border: [true, false, true, false]	
								}
							]);

							rows.push([
								{
									text: `APLICACAO: ${itens[i]['ETIQUETASITENS_APLICACAO'].toUpperCase()}\nMODELO: ${itens[i]['ETIQUETASITENS_MODELO'].toUpperCase()}`,
									font: 'Mercenary',
									fontSize: 25,
									alignment: 'left',		
									border: [true, false, true, true]								
								}
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

const isBarraGerada = function(produto, barra) {
	let stringGeradas = '789' + ('000000000' + produto).slice(-9);
    console.log('gerada: ', stringGeradas, (barra.substring(0, 12) == stringGeradas))
	return (barra.substring(0, 12) == stringGeradas);

};

const getBarCode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create("ean13", chave);
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};
