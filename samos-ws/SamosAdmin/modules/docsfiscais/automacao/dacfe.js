'use strict';

const fs        = require('fs');
const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const utils     = require('../../../services/samosUtils');
const codes     = require('rescode');
const moment    = require('moment-timezone');

codes.loadModules(['qrcode'], {"includetext" : false});

module.exports = {
    readById: (id, params) => { 
        return new Promise((resolve, reject) =>{
			api.movimentos().readById(id, params)
				.then(async res => {
					let pathLogo;
					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/cupom.png`;
					}
					let model = res.results[0];
					let obsCfe = (model['MOVIMENTOS_OBSERVACOES'].substring(0, 5) != '|||||' ? model['MOVIMENTOS_OBSERVACOES'].split('|').slice(0, 5).join('\n') : '');
					let produtos = model['MOVIMENTOS_ITENS'];
                    const qrcodes = await getQrcode('https://satsp.fazenda.sp.gov.br/COMSAT/Public/ConsultaPublica/ConsultaPublicaCfe.aspx');
					let msgs = [];
					let pess = [];
					let rows = [];
					let roda = [];

					let isConsumidor = model['MOVIMENTOS_NOME'].toUpperCase().match(/CONSUMIDOR/);

                    if(isConsumidor) {
						pess.push([
							{ text: `Cliente: ${model['PESSOAS_NOME']}`, font: 'Consolas', fontSize: 8 },
							{ text: '-'.repeat(53), font: 'Consolas', fontSize: 8 },
							{ text: [
								{ text: `Ite Código Un  Descrição\n`, font: 'Consolas', fontSize: 8},
								{ text: `b`.repeat(12), font: 'Consolas', fontSize: 8, color: 'white'},
     							{ text: `Qtde Unitario(R$)  ST  %ICMS Vlr Item(R$)`, font: 'Consolas', fontSize: 8}
								]
							},
							{ text: '-'.repeat(53), font: 'Consolas', fontSize: 8 }
						]);
					} else {
						pess.push([
							{ text: `Cliente: ${model['PESSOAS_NOME']}`, font: 'Consolas', fontSize: 8 },
							{ text: `Endereço: ${model['PESSOAS_ENDERECO']}`, font: 'Consolas', fontSize: 8 },
							{ text: `Bairro: ${model['PESSOAS_BAIRRO']}`, font: 'Consolas', fontSize: 8 },
							{ text: `Cidade: ${model['CIDADES_NOME']}/${model['CIDADES_ESTADO']}`, font: 'Consolas', fontSize: 8 },
							{ text: '-'.repeat(53), font: 'Consolas', fontSize: 8 },
							{ text: [
								{ text: `Ite Código Un  Descrição\n`, font: 'Consolas', fontSize: 8},
								{ text: `b`.repeat(12), font: 'Consolas', fontSize: 8, color: 'white'},
     							{ text: `Qtde Unitario(R$)  ST  %ICMS Vlr Item(R$)`, font: 'Consolas', fontSize: 8}
								]
							},
							{ text: '-'.repeat(53), font: 'Consolas', fontSize: 8 }
						]);
					}

					if(obsCfe) {
						msgs.push([
							{ text: obsCfe, font: 'Consolas', fontSize: 8},
							{ text: '-'.repeat(53), font: 'Consolas', fontSize: 8 }
						]);	
					}

					for(let i in produtos) {
						const item = ('000' + (parseInt(i) + 1)).slice(-3);
						const codigo = (`      ` + produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS']).slice(-6);
						const descricao = produtos[i]['PRODUTOS_NOME'].substring(0, 38);
						const unidade = produtos[i]['PRODUTOS_UNIDADE'];
						const qtde = (`        ` + produtos[i]['MOVIMENTOSITENS_QUANTIDADE']).slice(-8);
						const unitario = (`            ` + utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO'])).slice(-12);
						const total    = (`            ` + utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_TOTAL'])).slice(-12);
						const st = (`    ` + produtos[i]['MOVIMENTOSITENS_CST']).slice(-4);
						const pericms = (`     ` + (produtos[i]['MOVIMENTOSITENS_ICMS'] || '')).slice(-5);

						rows.push([
							{ text: [
								{ text: `${item} ${codigo} ${unidade}  ${descricao}\n`, font: 'Consolas', fontSize: 8},
     							{ text: 'b'.repeat(6), font: 'Consolas', fontSize: 8, color: 'white'},
     							{ text: `${qtde} x ${unitario} ${st} ${pericms} ${total}`, font: 'Consolas', fontSize: 8}								 
								]
							}
						])
					}

					roda.push([ // rodapé do cupom
						{ text: '-'.repeat(53), font: 'Consolas', fontSize: 8 },
						{
							text: [
								{ text: 'A'.repeat(31), font: 'Consolas', fontSize: 8, color: 'white'},
								{ text: 'Subtotal: ', font: 'Consolas', fontSize: 8},
								{ text: (`            ` + utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS'])).slice(-12), 
								  font: 'Consolas', fontSize: 8, bold: true }
							]
						},
						{
							text: [
								{ text: 'A'.repeat(30), font: 'Consolas', fontSize: 8, color: 'white'},
								{ text: 'Descontos: ', font: 'Consolas', fontSize: 8},
								{ text: (`            ` + (utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']) || '0,00')).slice(-12),
								  font: 'Consolas', fontSize: 8, bold: true }
							]
						},
						{
							text: [
								{ text: 'A'.repeat(34), font: 'Consolas', fontSize: 8, color: 'white'},
								{ text: 'Total: ', font: 'Consolas', fontSize: 8},
								{ text: (`            ` + utils.number.float2moeda(model['MOVIMENTOS_TOTAL'])).slice(-12),
								  font: 'Consolas', fontSize: 8, bold: true }
							]
						},
						{	text: `Valor aproximado dos tributos R$ ${utils.number.float2moeda(model['MOVIMENTOS_IMPOSTO']) || '0,00'}`,
							alignment: 'center', font: 'Consolas', fontSize: 8
						},
						{ text: '-'.repeat(53), font: 'Consolas', fontSize: 8 },
						{
							text: [
								{ text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'), font: 'Consolas', fontSize: 8},
								{ text: 'aaaaaa', font: 'Consolas', color: 'white'},
								{ text: 'Extrato No ', font: 'Consolas', fontSize: 8},
								{ text: (`000000` + model['MOVIMENTOS_NUMERO']).slice(-6),
								  font: 'Consolas', fontSize: 8, bold: true },
								{ text: 'aaaaaaaa', font: 'Consolas', color: 'white'},	
								{ text: moment.tz(params.timezone).format('HH:mm'), font: 'Consolas', fontSize: 8}
							]
						},
						{
							text: [
								{ text: 'aaaaaaaaaaa', font: 'Consolas', color: 'white'},
								{ text: 'Protocolo: ', font: 'Consolas', fontSize: 8},
								{ text: model['MOVIMENTOS_PROTOCOLO'],
								  font: 'Consolas', fontSize: 8, bold: true },
							]
						},
						{
							text: [
								{ text: 'a', font: 'Consolas', color: 'white'},								
								{ text: 'Chave: ', font: 'Consolas', fontSize: 7},
								{ text: utils.string.maskChaveCfe(model['MOVIMENTOS_NFE']),
								  font: 'Consolas', fontSize: 6.5, bold: true },
							]
						},
						{
							table: {
								body: [
									[
										{text: 'Mesma Linha', font: 'Consolas', color: 'white'},
										qrcodes ? {
											image: 'data:image/png;base64,' + qrcodes,
											width: 70,
											height: 70,
											alignment: 'center'
										} : 'SemQr'
									]
								]
							},
							layout: 'noBorders'
						},
						{ text: '-'.repeat(53), font: 'Consolas', fontSize: 8, color: 'white' },
						{ text: 'https://satsp.fazenda.sp.gov.br/COMSAT\n/Public/ConsultaPublica/ConsultaPublicaCfe.aspx', font: 'Consolas', fontSize: 8, alignment: 'center'},
						{ text: '-'.repeat(53), font: 'Consolas', fontSize: 4, color: 'white' },
						{ text: 'www.samos.com.br', font: 'Consolas', fontSize: 8, alignment: 'center', bold: true},
						{ text: '-'.repeat(53), font: 'Consolas', fontSize: 4, color: 'white' },
						{ text: 'Obrigado... Volte sempre', font: 'Consolas', fontSize: 8, alignment: 'center', bold: true},						
					]);


					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [180, 5, 180, 5],
						content: [
							{
								image: `${pathLogo}`,
								width: 198,
								height: 63,
								alignment: 'center'
							},				
							{   text: '-'.repeat(53), font: 'Consolas', fontSize: 8 },
							{
								text: `Extrato No ${model['MOVIMENTOS_NUMERO']}`,
								font: 'Consolas',								
								fontSize: 12,
								alignment: 'center'
							},
							{
								text: `Cupom Fiscal Eletrônico - S@T`,
								font: 'Consolas',								
								fontSize: 12,
								alignment: 'center'
							},
							{
								text: `NFC-e - Não permite aproveitamento do crédito de ICMS`,
								font: 'Consolas',								
								fontSize: 8,
								alignment: 'center'
							},
							{ text: '-'.repeat(53), font: 'Consolas', fontSize: 8 },
						]
                    };

					if(obsCfe) { docDefinition.content.push(msgs) }; // Mensagens

					docDefinition.content.push(pess); // dados do cliente

					docDefinition.content.push(rows); // Itens
	
					docDefinition.content.push(roda); // Rodapé

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
		});
    }
};

const getQrcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('qrcode', chave);
		const codqr = (codigo || '').toString("base64");
        resolve(codqr);
    });
};