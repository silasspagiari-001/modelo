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
					style: 'tableReport',
					table: {   // Recibo utilizará 6 colunas (width total 480)
						widths: [80, 80, 80, 80, 40, 120],
						body: []
					}
				} 
			],
			styles: {
				tableReport: {
					margin: [0, 0, 0, 0],
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.caixa().read(params)
				.then(res => {
					let rows   = docDefinition.content[1].table.body;
					let model;
					let pagNome      = '',
					    pagFantasia  = '',
						pagReferente = '',
						pagRestante  = '',
					    localEData   = '',
					    pagEndereco  = '',
					    pagTotal     = 0,
						pagTdc       = '',
						pagCpfcnpj   = '',
						recNome      = '',
						recFantasia  = '',
						recEndereco  = '',
						recTdc       = '',
						recCpfcnpj   = '',
						formaRecebimento = '';

					for(let i in res.results){
						model        = res.results[i];
						localEData   = model['CIDADES_NOME'] + ' - ' + model['CIDADES_ESTADO'] + ', ' + moment(model['MOVIMENTOSCAIXA_EMISSAO']).format('DD/MM/YYYY');						
						pagReferente = model['MOVIMENTOSCAIXA_NOME'] ||'';
						pagRestante  = 'M'.padEnd((600 - pagReferente.length), 'M ');

                        formaRecebimento += (model['MOVIMENTOSCAIXA_DINHEIRO'] > 0 ? 'Dinheiro: R$ ' + utils.number.float2moeda(model['MOVIMENTOSCAIXA_DINHEIRO']) : '') +
											(model['MOVIMENTOSCAIXA_CHEQUE']   > 0 ? ' Cheque: R$ ' + utils.number.float2moeda(model['MOVIMENTOSCAIXA_CHEQUE']) : '') +
											(model['MOVIMENTOSCAIXA_DEBITO']   > 0 ? ' Débito: R$ ' + utils.number.float2moeda(model['MOVIMENTOSCAIXA_DEBITO']) : '') +
											(model['MOVIMENTOSCAIXA_CREDITO'] > 0 ? ' Crédito: R$ ' + utils.number.float2moeda(model['MOVIMENTOSCAIXA_CREDITO']) : '') +											
											(model['MOVIMENTOSCAIXA_OUTRO'] > 0 ? (model['MOVIMENTOSCAIXA_TIPO'] == 'E' ? ' Financeira: R$ ' :  ' Transferência: R$ ') + utils.number.float2moeda(model['MOVIMENTOSCAIXA_OUTRO']) : '');
											
						if(model['MOVIMENTOSCAIXA_TIPO'] == 'E') {
							pagNome     = model['PESSOAS_NOME']
							pagFantasia = model['PESSOAS_FANTASIA'] || '';
							pagEndereco = model['PESSOAS_ENDERECO'] + ', ' + model['PESSOAS_NUMERO'] + ' - ' + model['PESSOAS_BAIRRO'];
							pagCpfcnpj  = model['PESSOAS_CPFCNPJ'];
							recNome     = model['EMPRESAS_NOME'];
							recFantasia = model['EMPRESAS_FANTASIA'] || '';							
							recEndereco = model['EMPRESAS_ENDERECO'] + ', ' + model['EMPRESAS_NUMERO'] + ' - ' + model['EMPRESAS_BAIRRO'];
							recCpfcnpj  = model['EMPRESAS_CPFCNPJ'];
						} else {
							pagNome     = model['EMPRESAS_NOME'];
							pagFantasia = model['EMPRESAS_FANTASIA'] || '';							
							pagEndereco = model['EMPRESAS_ENDERECO'] + ', ' + model['EMPRESAS_NUMERO'] + ' - ' + model['EMPRESAS_BAIRRO'];							
							pagCpfcnpj  = model['EMPRESAS_CPFCNPJ'];
							recNome     = model['PESSOAS_NOME'];
							recFantasia = model['PESSOAS_FANTASIA'] || '';
							recEndereco = model['PESSOAS_ENDERECO'] + ', ' + model['PESSOAS_NUMERO'] + ' - ' + model['PESSOAS_BAIRRO'];
							recCpfcnpj  = model['PESSOAS_CPFCNPJ'];
						}

						pagTotal = (model['MOVIMENTOSCAIXA_TOTAL'] - model['MOVIMENTOSCAIXA_DUPLICATA']);
						pagTdc   = (pagCpfcnpj.length == 11 ? 'CPF' : 'CNPJ');
						recTdc   = (recCpfcnpj.length == 11 ? 'CPF' : 'CNPJ');

						rows.push([
							{
								colSpan: 3,
								text: 'Recibo',
								fontSize: 22,
								style: 'tableHeader',
								alignment: 'center'
							},{},{},
							{
								text: [
									{
										text: 'Número\n',
										fontSize: 10, 
										alignment: 'left'
									},
									{
										text: `${model['MOVIMENTOSCAIXA_ID']}\n`,
										alignment: 'right',
										style: {
											bold: true,
											fontSize: 14
										}
									}
									
								],
								colSpan: 2
							},{},
							{
								text: [
									{
										text: 'Valor\n',
										fontSize: 10, 
										alignment: 'left'
									},
									{
										text: `R$ ${utils.number.float2moeda(pagTotal)}\n`,
										alignment: 'right',
										style: {
											bold: true,
											fontSize: 14
										}
									}
									
								]
							}								
						]);

						rows.push([
							{
								colSpan: 6,
								text: [								
									{
										text:  `Recebi(emos) de:\n`,
										alignment: 'justify',
										style: {fontSize: 8}
									},
									{
										text:  `${pagNome} ${pagFantasia ? ' (' + pagFantasia + ')' : ''}`,
										alignment: 'justify',
										style: {fontSize: 12}
									}
								]
							},{},{},{},{},{}
						]);

						rows.push([
							{
								colSpan: 6,
								text: [								
									{
										text:  `Endereço:\n`,
										alignment: 'justify',
										style: {fontSize: 8}
									},
									{
										text:  `${pagEndereco}`,
										alignment: 'justify',
										style: {fontSize: 12}
									}
								]
							},{},{},{},{},{}
						]);

						rows.push([
							{								
								colSpan: 6,
								text: [								
									{
										text:  `A importância de:\n`,
										alignment: 'justify',
										style: {fontSize: 8}
									},
									{
										text:  `R$ ${utils.number.float2moeda(pagTotal)} (${utils.number.ValorPorExtenso(pagTotal)})`,
										alignment: 'justify',
										style: {fontSize: 12}
									}
								]
							},{},{},{},{},{}
						]);

						rows.push([
							{
								colSpan: 6,
								text: [								
									{
										text:  `Referente a:\n`,
										style: {fontSize: 8}
									},
									{
										text:  `${pagReferente}`,
										alignment: 'justify',
										style: {fontSize: 9}
									},
									{
										text:  `${pagRestante}`,
										alignment: 'justify',
										style: {
											fontSize: 9, 
											color: 'white'
										}
									}
								]
							},{},{},{},{},{}
						]);

						rows.push([
							{
								colSpan: 6,
								text: [								
									{
										text:  `Forma de Recebimento:\n`,
										style: {fontSize: 8}
									},
									{
										text:  `${formaRecebimento}`,
										alignment: 'justify',
										style: {fontSize: 10}
									}
								]
							},{},{},{},{},{}
						]);
						
						rows.push([
							{
								colSpan: 6,
								text: [
									{
										text: 'Nome Emitente:\n',
										fontSize: 8, 
										alignment: 'left'
									},
									{
										text:  `${recNome} ${recFantasia ? ' (' + recFantasia + ')' : ''}\n`,
										alignment: 'left',
										style: {
											fontSize: 12
										}
									}
								]
							},{},{},{},{},{}
						]);

						rows.push([
							{
								colSpan: 6,
								text: [
									{
										text: 'Endereço:\n',
										fontSize: 8, 
										alignment: 'left'
									},
									{
										text:  `${recEndereco}\n`,
										alignment: 'left',
										style: {
											fontSize: 12
										}
									}
								]
							},{},{},{},{},{}
						]);

						rows.push([
							{
								colSpan: 6,
								text: [
									{
										text: 'Cpf/Cnpj/RG:\n',
										fontSize: 8, 
										alignment: 'left'
									},
									{
										text:  `${utils.string.maskCnp(recCpfcnpj)}\n`,
										alignment: 'left',
										style: {
											fontSize: 12
										}
									}
								]
							},{},{},{},{},{}
						]);

// Data e assinatura vai aqui agora...

						rows.push([
							{
								colSpan: 3,
								text: [
									{
										text: 'Local e Data:\n',
										fontSize: 8, 
										alignment: 'left'
									},
									{
										text:  `${localEData}\n\n`,
										alignment: 'left',
										style: {
											fontSize: 12
										}
									}
								]
							},{},{},
							{
								colSpan: 3,
								text: [
									{
										text: 'Assinatura:\n',
										fontSize: 8, 
										alignment: 'left'
									},
									{
										text: `A\nA\n`,
										alignment: 'left',
										style: { fontSize: 12, color: 'white' }
									}
								]	
							},{},{}
						]);
					};

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	},
		
};
