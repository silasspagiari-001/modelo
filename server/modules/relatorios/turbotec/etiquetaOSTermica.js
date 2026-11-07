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
			pageMargins: [9, 0, 5, 0],
			content: [
				{
					table: {  
						widths: [264], // 284 Uma coluna apenas
						body: []
					}
				}
			]
		};

        return new Promise((resolve, reject) => {
			api.ordens().readById(params.id, params)
				.then(async res => {
					let rows = docDefinition.content[0].table.body;
					const model = res.results[0];

					let barraProduto   = utils.string.onlyNumbers(model['PRODUTOS_BARRA'] || '');
					let codProduto     = model['ORDENS_IDSKY'].toString();
					let codBarProduto  = isBarraGerada(codProduto, barraProduto) ? await getBarCode(barraProduto) : '';
					let lfDescricao    = model['ORDENS_DESCRICAO'].length > 30 ? '' : '\n\n'
					let pathBranco     = `${appRoot}/resources/images/etiqueta/emBranco.png`;

					rows.push([
						{ text: "nada", fontSize: 6, color: 'white', border: [false, false, false, false]}
					])

					rows.push([
						{
							text: `${model['ORDENS_DESCRICAO']}${lfDescricao}`,
							font: 'Mercenary',
							fontSize: 30,
							alignment: 'left',		
							border: [true, true, true, false]							
						},
					]);
					rows.push([
						{
							text: `APLICACAO: ${model['ORDENS_GEOLOCALIZACAO']}\nMODELO: ${model['ORDENS_IDENTIFICACAO']}`,
							font: 'Mercenary',
							fontSize: 25,
							alignment: 'left',		
							border: [true, false, true, false]
						}
					]);
					rows.push(
						[
							codBarProduto ? {
								image: 'data:image/png;base64,' + codBarProduto,
								width: 55,
								height: 20,
								alignment: 'right',
								border: [true, false, true, true]
							} : {
								image: pathBranco,
								width: 55,
								height: 20,
								alignment: 'right',
								border: [true, false, true, true]
							},	
						]);												
															
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
//  console.log('gerada: ', stringGeradas, (barra.substring(0, 12) == stringGeradas))
	return (barra.substring(0, 12) == stringGeradas);

};

const getBarCode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create("ean13", chave);
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};
