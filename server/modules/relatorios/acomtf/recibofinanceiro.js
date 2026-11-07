'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getFinanceirosById = async function(id, params){
	try {
		const ids = id.toString().split(',');
		let sqlWhere = ` where `;

		sqlWhere += ids.reduce((result, id) => {
			return result += ` FINANCEIROS_ID = '${id}' or `
		}, '').slice(0, -3);
		
		const sqlSearch = `select 
				FINANCEIROS_ID,
				FINANCEIROS_TIPO,
				FINANCEIROS_ID_EMPRESAS,
				EMPRESAS_FANTASIA,
				EMPRESAS_TELEFONE, 
				EMPRESAS_CELULAR,
				EMPRESAS_NOME,
				EMPRESAS_EMAIL,
				EMPRESAS_INSCRICAO,
				EMPRESAS_CPFCNPJ,
				EMPRESAS_ENDERECO,
				EMPRESAS_NUMERO,
				EMPRESAS_BAIRRO,
				CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
				CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
				CIDADESPESSOA.CIDADES_NOME as PESSOAS_CIDADES,
				CIDADESPESSOA.CIDADES_ESTADO as PESSOAS_ESTADO,
				FINANCEIROS_ID_DOCUMENTOS,
				DOCUMENTOS_COLETACARTAO,
				FINANCEIROS_ID_MOVIMENTOS,
				FINANCEIROS_ID_USUARIOS,
				USUARIOS_NOME,
				USUARIOS_EMAIL,
				USUARIOS_TELEFONE,
				USUARIOS_CELULAR,
				FINANCEIROS_ID_PESSOAS,
				PESSOAS_CPFCNPJ,
				PESSOAS_TIPO,
				PESSOAS_ID_CIDADES,
				PESSOAS_INSCRICAO,
				PESSOAS_NOME,
				PESSOAS_FANTASIA,
				PESSOAS_ENDERECO,
				PESSOAS_ENDERECOCOBRANCA,
				PESSOAS_BAIRROCOBRANCA,
				PESSOAS_CEPCOBRANCA,
				PESSOAS_NUMEROCOBRANCA,
				CIDADESCOBRANCA.CIDADES_NOME as CIDADESCOBRANCA_CIDADE_COBRANCA,
				CIDADESCOBRANCA.CIDADES_ESTADO as CIDADESCOBRANCA_ESTADO_COBRANCA,
				PESSOAS_NUMERO,
				PESSOAS_BAIRRO,
				PESSOAS_EMAIL,
				PESSOAS_PAGINA,
				PESSOAS_TELEFONE,
				PESSOAS_CELULAR,
				PESSOAS_CEP,
				PESSOAS_CREDITO,
				CIDADES.CIDADES_NOME,
				CIDADES.CIDADES_ESTADO,
				MOVIMENTOS_ID_PROPRIEDADES,
				PROPRIEDADES_CPFCNPJ,
				PROPRIEDADES_NOME,
				PROPRIEDADES_CEP,
				PROPRIEDADES_ENDERECO,
				PROPRIEDADES_NUMERO,
				PROPRIEDADES_BAIRRO,
				PROPRIEDADES_CEP,
				CIDADESPROPRIEDADE.CIDADES_NOME as CIDADES_NOMEPROPRIEDADE,
				CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
				FINANCEIROS_ID_PORTADORES,
				PORTADORES_NOME,
				PORTADORES_ID_BANCOS,
				BANCOS_NOME,
				PORTADORES_AGENCIA,
				PORTADORES_CONTA,
				PORTADORES_CONVENIO,
				PORTADORES_CARTEIRA,
				PORTADORES_CPFCNPJ,
				PORTADORES_ENDERECO,
				PORTADORES_NUMERO,
				PORTADORES_BAIRRO,
				PORTADORES_CEP,
				PORTADORES_PROTESTO,
				PORTADORES_MORA,
				PORTADORES_MULTA,
				CIDADESPORTADOR.CIDADES_NOME as CIDADES_NOMEPORTADOR,
				CIDADESPORTADOR.CIDADES_ESTADO as CIDADES_ESTADOPORTADOR,
				FINANCEIROS_ID_PRAZOS,
				PRAZOS_NOME,
				FINANCEIROS_ID_APLICACOES,
				APLICACOES_NOME,
				FINANCEIROS_ID_CUSTOS,
				CUSTOS_NOME,
				FINANCEIROS_PARCELA,
				FINANCEIROS_PARCELAS,
				FINANCEIROS_NOSSONUMERO,
				FINANCEIROS_BOLETO,
				FINANCEIROS_EMISSAO,
				FINANCEIROS_VENCIMENTO,
				FINANCEIROS_PAGAMENTO,
				FINANCEIROS_BAIXA,
				FINANCEIROS_ORIGINAL,
				FINANCEIROS_ABERTO,
				FINANCEIROS_DESCONTOS,
				FINANCEIROS_JUROS,
				FINANCEIROS_TAXAS,
				FINANCEIROS_PAGO,
				FINANCEIROS_TOTAL,
				FINANCEIROS_OBSERVACOES,
				FINANCEIROS_STATUS,
				FINANCEIROS_EXPORTADO,
				FINANCEIROS_LOG,
				FINANCEIROS_NUMERO,
				FINANCEIROS_SERIE,
				FINANCEIROS_ID_EMPRESAORIGEM,
				FINANCEIROS_NUMEROORIGEM,
				FINANCEIROS_SERIEORIGEM,
				iif(FINANCEIROS_STATUS = 'P',FINANCEIROS_PAGAMENTO - FINANCEIROS_VENCIMENTO,FINANCEIROS_VENCIMENTO - CURRENT_DATE) as PRAZOCALCULADO_FINANCEIRO,
				(FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZOCALCULADO_BOLETO
			from FINANCEIROS
				left outer join EMPRESAS                      on EMPRESAS_ID                   = FINANCEIROS_ID_EMPRESAS
				left outer join DOCUMENTOS                    on DOCUMENTOS_ID                 = FINANCEIROS_ID_DOCUMENTOS
				left outer join PRAZOS                        on PRAZOS_ID                     = FINANCEIROS_ID_PRAZOS
				left outer join PESSOAS                       on PESSOAS_ID                    = FINANCEIROS_ID_PESSOAS
				left outer join PORTADORES                    on PORTADORES_ID                 = FINANCEIROS_ID_PORTADORES
				left outer join MOVIMENTOS                    on MOVIMENTOS_ID                 = FINANCEIROS_ID_MOVIMENTOS
				left outer join PROPRIEDADES                  on PROPRIEDADES_ID               = MOVIMENTOS_ID_PROPRIEDADES
				left outer join BANCOS                        on BANCOS_ID                     = PORTADORES_ID_BANCOS
				left outer join CIDADES                       on CIDADES.CIDADES_ID            = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESPESSOA      on CIDADESPESSOA.CIDADES_ID      = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESPORTADOR    on CIDADESPORTADOR.CIDADES_ID    = PORTADORES_ID_CIDADES
				left outer join CIDADES as CIDADESEMPRESA     on CIDADESEMPRESA.CIDADES_ID     = EMPRESAS_ID_CIDADES
				left outer join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES_ID_CIDADES
				left outer join CIDADES as CIDADESCOBRANCA    on CIDADESCOBRANCA.CIDADES_ID    = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
				left outer join APLICACOES                    on APLICACOES_ID                 = FINANCEIROS_ID_APLICACOES
				left outer join CUSTOS                        on CUSTOS_ID                     = FINANCEIROS_ID_CUSTOS
				left outer join USUARIOS                      on USUARIOS_ID                   = FINANCEIROS_ID_USUARIOS
			${sqlWhere}
			order by FINANCEIROS_ID_EMPRESAS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA  `;

		const results = await samosFB.executeSQL(sqlSearch, params);

		await Promise.all(results.map(async financeiro => {
			const sqlItens = `select 
				FINANCEIROSITENS.*, 
				APLICACOES_NOME, 
				PORTADORES_NOME
			from FINANCEIROSITENS
			left outer join APLICACOES on APLICACOES_ID = FINANCEIROSITENS_ID_APLICACOES
			left outer join PORTADORES on PORTADORES_ID = FINANCEIROSITENS_ID_PORTADORES
			where FINANCEIROSITENS_ID_FINANCEIROS = ${financeiro['FINANCEIROS_ID']} 
			order by FINANCEIROSITENS_ID`;

			financeiro['FINANCEIROS_ITENS'] = await samosFB.executeSQL(sqlItens, params);
		}));

		return { 
			results, 
			total: results.length 
		};
	} catch(error) {
		const msg = 'Falha ao buscar financeiros por id';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
} 

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
			getFinanceirosById(params.id, params)
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
						pagReferente = model['PESSOAS_NOME'] ||'';
						pagRestante  = 'M'.padEnd((600 - pagReferente.length), 'M ');

                        formaRecebimento += '';
											
						if(model['FINANCEIROS_TIPO'] == 'R') {
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

						pagTotal = model['FINANCEIROS_PAGO']
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
										text: `${model['FINANCEIROS_ID']}\n`,
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
