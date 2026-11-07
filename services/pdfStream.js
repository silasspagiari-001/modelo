'use strict';

const path = require('path');
const appRoot = path.dirname(require.main.filename);
const fs = require('fs');
const mkdirp = require('mkdirp'); 
const PdfPrinter = require('pdfmake');

const fonts = {
	Roboto: {
		normal:      appRoot + '/resources/fonts/Roboto-Regular.ttf',
		bold:        appRoot + '/resources/fonts/Roboto-Medium.ttf',
		italics:     appRoot + '/resources/fonts/Roboto-Italic.ttf',
		bolditalics: appRoot + '/resources/fonts/Roboto-MediumItalic.ttf'
	},
	Consolas: {
		normal:      appRoot + '/resources/fonts/Consolas-Regular.ttf',
		bold:        appRoot + '/resources/fonts/Consolas-Bold.ttf',
		italics:     appRoot + '/resources/fonts/Consolas-Italic.ttf',
		bolditalics: appRoot + '/resources/fonts/Consolas-BoldItalic.ttf'
	},
	Courier: {
		normal:      appRoot + '/resources/fonts/CourierNew-Medium.ttf',
		bold:        appRoot + '/resources/fonts/CourierNew-Bold.ttf',
		italics:     appRoot + '/resources/fonts/CourierNew-Italic.ttf',
		bolditalics: appRoot + '/resources/fonts/courierNew-BoldItalic.ttf'
	},
	Mercenary: {
		normal:      appRoot + '/resources/fonts/Mercenary-Medium.ttf',
		bold:        appRoot + '/resources/fonts/Mercenary-Bold.ttf',
		italics:     appRoot + '/resources/fonts/Mercenary-Italic.ttf',
		bolditalics: appRoot + '/resources/fonts/Mercenary-BoldItalic.ttf'
	}    	
};

module.exports = async function (docDefinition, resolve) {
    const pdfDoc = new PdfPrinter(fonts).createPdfKitDocument(docDefinition);
    const caminhoPdf = 'public/pdf/';
    const caminhoCompleto = `${appRoot}/public/pdf/`;
    const now = new Date().getTime();

    if (!fs.existsSync(caminhoCompleto)){
        await mkdirp(caminhoCompleto)
    }
    
    pdfDoc.pipe(fs.createWriteStream(`${caminhoCompleto}${now}.pdf`));
    pdfDoc.end();

    if(resolve) {
        resolve({ results: [ {name: `${caminhoPdf}${now}.pdf`} ] });
    } else {
        return `${caminhoPdf}${now}.pdf`
    }
};