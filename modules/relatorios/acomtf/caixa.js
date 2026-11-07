'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getCaixa = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, emissao, status, id, incluirDuplicata } = params;
		const db = await samosFB.conectarBanco(params.client);
		const sqlId      = id > 0 ? ` and MOVIMENTOSCAIXA_ID = ${id} ` : '';
		const sqlValores = ` and (((MOVIMENTOSCAIXA_DINHEIRO       +
									MOVIMENTOSCAIXA_CHEQUE         +
									MOVIMENTOSCAIXA_DEBITO         +
									MOVIMENTOSCAIXA_CREDITO        +
									MOVIMENTOSCAIXA_DUPLICATA      +
									MOVIMENTOSCAIXA_BOLETO         +
									MOVIMENTOSCAIXA_CREDITOPESSOA  +
									MOVIMENTOSCAIXA_CREDITOLOJA    +
									MOVIMENTOSCAIXA_ALIMENTACAO    +
									MOVIMENTOSCAIXA_REFEICAO       +
									MOVIMENTOSCAIXA_PRESENTE       +
									MOVIMENTOSCAIXA_TRANSFERENCIAS + 
									MOVIMENTOSCAIXA_OUTRO          +
									MOVIMENTOSCAIXA_COMBUSTIVEL) > 0) or (MOVIMENTOSCAIXA_EXPORTADO = 'X') or (MOVIMENTOSCAIXA_EXPORTADO = 'Z'))`
		const sqlStatus = status == 0 ? ` and MOVIMENTOSCAIXA_STATUS = 'A' ` : status == 1 ? ` and MOVIMENTOSCAIXA_STATUS = 'F' ` : ''
		const sqlSearch = `execute block returns (
			USUARIOS_LOGIN varchar(50),
			MOVIMENTOSCAIXA_EMISSAO date,
			MOVIMENTOSCAIXA_HORA varchar(10),
			MOVIMENTOSCAIXA_VENCIMENTO date,
			MOVIMENTOSCAIXA_ID integer,
			MOVIMENTOSCAIXA_ID_MOVIMENTOS integer,
			MOVIMENTOSCAIXA_ID_APLICACOES integer,
			MOVIMENTOSCAIXA_NUMERO char(1),
			CONTROLES_ID_PORTADORES integer,
			PORTADORES_NOME varchar(50),
			CONTROLES_DOCUMENTO varchar(20),
			MOVIMENTOSCAIXA_ID_PESSOAS integer,
			MOVIMENTOSCAIXA_NOME varchar(512),
			MOVIMENTOSCAIXA_LOG varchar(50),
			PESSOAS_NOME varchar(50),
			PESSOAS_FANTASIA varchar(50),
			PESSOAS_CPFCNPJ varchar(15),
			PESSOAS_ENDERECO varchar(50),
			PESSOAS_NUMERO varchar(10),                          
			PESSOAS_CEP varchar(8),
			PESSOAS_BAIRRO varchar(50),
			PESSOAS_ID_CIDADES integer,     
			EMPRESAS_NOME varchar(50),
			EMPRESAS_FANTASIA varchar(50),
			EMPRESAS_ENDERECO varchar(50),
			EMPRESAS_NUMERO varchar(10),
			EMPRESAS_BAIRRO varchar(50),
			EMPRESAS_CPFCNPJ varchar(15),
			CIDADES_NOME varchar(50),
			CIDADES_ESTADO varchar(2),      
			APLICACOES_NOME varchar(50),
			DOCUMENTOS_NOME varchar(50),
			MOVIMENTOS_NUMERO integer,
			MOVIMENTOS_SERIE varchar(3),
			MOVIMENTOS_IMPOSTO numeric (12,2),
			MOVIMENTOSCAIXA_TIPO char(1),
			MOVIMENTOSCAIXA_STATUS char(1),
			MOVIMENTOSCAIXA_EXPORTADO char(1),
			MOVIMENTOSCAIXA_DINHEIRO numeric (12,2),
			MOVIMENTOSCAIXA_TRANSFERENCIAS numeric (12,2),
			MOVIMENTOSCAIXA_CHEQUE numeric (12,2),
			MOVIMENTOSCAIXA_CREDITO numeric (12,2),
			MOVIMENTOSCAIXA_DEBITO numeric (12,2),
			MOVIMENTOSCAIXA_CREDITOLOJA numeric (12,2),
			MOVIMENTOSCAIXA_CREDITOPESSOA numeric (12,2),
			MOVIMENTOSCAIXA_ALIMENTACAO numeric (12,2),
			MOVIMENTOSCAIXA_REFEICAO numeric (12,2),
			MOVIMENTOSCAIXA_PRESENTE numeric (12,2),
			MOVIMENTOSCAIXA_COMBUSTIVEL numeric (12,2),
			MOVIMENTOSCAIXA_DUPLICATA numeric (12,2),
			MOVIMENTOSCAIXA_BOLETO numeric (12,2),
			MOVIMENTOSCAIXA_OUTRO numeric (12,2),
			MOVIMENTOSCAIXA_TROCO numeric (12, 2),
			MOVIMENTOSCAIXA_TOTAL numeric (12,2),
			MOVIMENTOSCAIXA_SALDO numeric (12,2),
			SALDOS_DINHEIRO numeric (12,2),
			SALDOS_TRANSFERENCIA numeric(12, 2),
			SALDOS_CHEQUE numeric (12,2),
			SALDOS_CREDITO numeric (12,2),
			SALDOS_DEBITO numeric (12,2),
			SALDOS_CREDITOLOJA numeric (12,2),
			SALDOS_CREDITOPESSOA numeric(12,2),
			SALDOS_ALIMENTACAO numeric (12,2),
			SALDOS_REFEICAO numeric (12,2),
			SALDOS_PRESENTE numeric (12,2),
			SALDOS_COMBUSTIVEL numeric (12,2),                
			SALDOS_DUPLICATA numeric (12,2),
			SALDOS_BOLETO numeric (12,2),
			SALDOS_OUTRO numeric (12,2),
			SALDOS_TROCO numeric (12,2)
		) as
			declare variable V_SALDO    numeric (12, 2);
			declare variable V_SALDODIN numeric (12, 2);
			declare variable V_SALDOTRA numeric (12, 2);
			declare variable V_SALDOCHE numeric (12, 2);
			declare variable V_SALDOCRE numeric (12, 2);
			declare variable V_SALDODEB numeric (12, 2);
			declare variable V_SALDOCLJ numeric (12, 2);
			declare variable V_SALDOCPE numeric (12, 2);
			declare variable V_SALDOALI numeric (12, 2);
			declare variable V_SALDOREF numeric (12, 2);
			declare variable V_SALDOPRE numeric (12, 2);
			declare variable V_SALDOCMB numeric (12, 2);
			declare variable V_SALDODUP numeric (12, 2);
			declare variable V_SALDOBOL numeric (12, 2);
			declare variable V_SALDOOUT numeric (12, 2);
			declare variable V_SALDOTRO numeric (12, 2);
			begin
			  V_SALDO    = 0;
			  V_SALDODIN = 0;
			  V_SALDOTRA = 0;
			  V_SALDOCHE = 0;
			  V_SALDOCRE = 0;
			  V_SALDODEB = 0;
			  V_SALDOCLJ = 0;
			  V_SALDOCPE = 0;
			  V_SALDOALI = 0;
			  V_SALDOREF = 0;
			  V_SALDOPRE = 0;
			  V_SALDOCMB = 0;
			  V_SALDODUP = 0;
			  V_SALDOBOL = 0;
			  V_SALDOOUT = 0;
			  V_SALDOTRO = 0;
			  for
				select USUARIOS_LOGIN,
					   MOVIMENTOSCAIXA_EMISSAO,
					   MOVIMENTOSCAIXA_HORA,
					   MOVIMENTOSCAIXA_VENCIMENTO,
					   MOVIMENTOSCAIXA_ID,
					   MOVIMENTOSCAIXA_ID_MOVIMENTOS,
					   MOVIMENTOSCAIXA_ID_APLICACOES,
					   MOVIMENTOSCAIXA_NUMERO,
					   CONTROLES_ID_PORTADORES,
					   PORTADORES_NOME,
					   CONTROLES_DOCUMENTO,
					   MOVIMENTOSCAIXA_ID_PESSOAS,
					   MOVIMENTOSCAIXA_NOME,
					   MOVIMENTOSCAIXA_LOG,
					   PESSOAS_NOME,
					   PESSOAS_FANTASIA,
					   PESSOAS_CPFCNPJ,
					   PESSOAS_ENDERECO,
					   PESSOAS_NUMERO,                          
					   PESSOAS_CEP,
					   PESSOAS_BAIRRO,
					   PESSOAS_ID_CIDADES,                            
					   EMPRESAS_NOME,
					   EMPRESAS_FANTASIA,
					   EMPRESAS_ENDERECO,
					   EMPRESAS_NUMERO,
					   EMPRESAS_BAIRRO,
					   EMPRESAS_CPFCNPJ,
					   CIDADES_NOME,
					   CIDADES_ESTADO,                            
					   APLICACOES_NOME,
					   DOCUMENTOS_NOME,
					   MOVIMENTOS_NUMERO,
					   MOVIMENTOS_SERIE,
					   MOVIMENTOS_IMPOSTO,
					   trim(MOVIMENTOSCAIXA_TIPO),
					   trim(MOVIMENTOSCAIXA_STATUS),
					   trim(MOVIMENTOSCAIXA_EXPORTADO),
					   MOVIMENTOSCAIXA_DINHEIRO,
					   MOVIMENTOSCAIXA_TRANSFERENCIAS,
					   MOVIMENTOSCAIXA_CHEQUE,
					   MOVIMENTOSCAIXA_CREDITO,
					   MOVIMENTOSCAIXA_DEBITO,
					   MOVIMENTOSCAIXA_CREDITOLOJA,
					   MOVIMENTOSCAIXA_CREDITOPESSOA,
					   MOVIMENTOSCAIXA_ALIMENTACAO,
					   MOVIMENTOSCAIXA_REFEICAO,
					   MOVIMENTOSCAIXA_PRESENTE,
					   MOVIMENTOSCAIXA_COMBUSTIVEL,
					   MOVIMENTOSCAIXA_DUPLICATA,
					   MOVIMENTOSCAIXA_BOLETO,
					   MOVIMENTOSCAIXA_OUTRO,
					   MOVIMENTOSCAIXA_TROCO,
					   (MOVIMENTOSCAIXA_DINHEIRO  + MOVIMENTOSCAIXA_TRANSFERENCIAS + MOVIMENTOSCAIXA_CHEQUE     + MOVIMENTOSCAIXA_CREDITO +
						MOVIMENTOSCAIXA_DEBITO    + MOVIMENTOSCAIXA_CREDITOLOJA + MOVIMENTOSCAIXA_CREDITOPESSOA + MOVIMENTOSCAIXA_ALIMENTACAO +
						MOVIMENTOSCAIXA_REFEICAO  + MOVIMENTOSCAIXA_PRESENTE    + MOVIMENTOSCAIXA_COMBUSTIVEL +
						${incluirDuplicata == "true" ? "MOVIMENTOSCAIXA_DUPLICATA + " : ""} MOVIMENTOSCAIXA_BOLETO + MOVIMENTOSCAIXA_OUTRO - MOVIMENTOSCAIXA_TROCO) as MOVIMENTOSCAIXA_TOTAL
				from MOVIMENTOSCAIXA
				left outer join EMPRESAS   on EMPRESAS_ID   = MOVIMENTOSCAIXA_ID_EMPRESAS
				left outer join CIDADES    on CIDADES_ID    = EMPRESAS_ID_CIDADES
				left outer join PESSOAS    on PESSOAS_ID    = MOVIMENTOSCAIXA_ID_PESSOAS
				left outer join APLICACOES on APLICACOES_ID = MOVIMENTOSCAIXA_ID_APLICACOES
				left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
				left outer join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
				left outer join USUARIOS   on USUARIOS_ID   = MOVIMENTOSCAIXA_ID_USUARIOS
				left outer join CONTROLES  on CONTROLES_ID_MOVIMENTOS = MOVIMENTOSCAIXA_ID_MOVIMENTOS and MOVIMENTOSCAIXA_ID_MOVIMENTOS > 0
				left outer join PORTADORES on PORTADORES_ID = CONTROLES_ID_PORTADORES
				where MOVIMENTOSCAIXA_ID_EMPRESAS = '${empresa}' and
					  MOVIMENTOSCAIXA_EMISSAO     = '${emissao.replace (/\//ig,'.')}'
					  ${sqlId}
					  ${sqlStatus}
					  ${sqlValores}
					  and ((MOVIMENTOSCAIXA_TIPO = 'E') or (MOVIMENTOSCAIXA_TIPO = 'S'))
					  ${incluirDuplicata == "true" ? "" : " and MOVIMENTOSCAIXA_DUPLICATA = 0"}
				order by MOVIMENTOSCAIXA_EMISSAO, MOVIMENTOSCAIXA_NUMERO, MOVIMENTOSCAIXA_HORA
				into  :USUARIOS_LOGIN,
					  :MOVIMENTOSCAIXA_EMISSAO,
					  :MOVIMENTOSCAIXA_HORA,
					  :MOVIMENTOSCAIXA_VENCIMENTO,
					  :MOVIMENTOSCAIXA_ID,
					  :MOVIMENTOSCAIXA_ID_MOVIMENTOS,
					  :MOVIMENTOSCAIXA_ID_APLICACOES,
					  :MOVIMENTOSCAIXA_NUMERO,
					  :CONTROLES_ID_PORTADORES,
					  :PORTADORES_NOME,
					  :CONTROLES_DOCUMENTO,
					  :MOVIMENTOSCAIXA_ID_PESSOAS,
					  :MOVIMENTOSCAIXA_NOME,
					  :MOVIMENTOSCAIXA_LOG,
					  :PESSOAS_NOME,
					  :PESSOAS_FANTASIA,
					  :PESSOAS_CPFCNPJ,
					  :PESSOAS_ENDERECO,
					  :PESSOAS_NUMERO,                          
					  :PESSOAS_CEP,
					  :PESSOAS_BAIRRO,
					  :PESSOAS_ID_CIDADES,
					  :EMPRESAS_NOME,
					  :EMPRESAS_FANTASIA,
					  :EMPRESAS_ENDERECO,
					  :EMPRESAS_NUMERO,
					  :EMPRESAS_BAIRRO,
					  :EMPRESAS_CPFCNPJ,
					  :CIDADES_NOME,
					  :CIDADES_ESTADO,
					  :APLICACOES_NOME,
					  :DOCUMENTOS_NOME,
					  :MOVIMENTOS_NUMERO,
					  :MOVIMENTOS_SERIE,    
					  :MOVIMENTOS_IMPOSTO,                     
					  :MOVIMENTOSCAIXA_TIPO,
					  :MOVIMENTOSCAIXA_STATUS,
					  :MOVIMENTOSCAIXA_EXPORTADO,
					  :MOVIMENTOSCAIXA_DINHEIRO,
					  :MOVIMENTOSCAIXA_TRANSFERENCIAS,
					  :MOVIMENTOSCAIXA_CHEQUE,
					  :MOVIMENTOSCAIXA_CREDITO,
					  :MOVIMENTOSCAIXA_DEBITO,
					  :MOVIMENTOSCAIXA_CREDITOLOJA,
					  :MOVIMENTOSCAIXA_CREDITOPESSOA,                          
					  :MOVIMENTOSCAIXA_ALIMENTACAO,
					  :MOVIMENTOSCAIXA_REFEICAO,
					  :MOVIMENTOSCAIXA_PRESENTE,
					  :MOVIMENTOSCAIXA_COMBUSTIVEL,
					  :MOVIMENTOSCAIXA_DUPLICATA,
					  :MOVIMENTOSCAIXA_BOLETO,
					  :MOVIMENTOSCAIXA_OUTRO,
					  :MOVIMENTOSCAIXA_TROCO,
					  :MOVIMENTOSCAIXA_TOTAL
			  do
				begin
				  if (MOVIMENTOSCAIXA_TIPO = 'E') then
						begin
							V_SALDO    = V_SALDO    + :MOVIMENTOSCAIXA_TOTAL;
							V_SALDODIN = V_SALDODIN + :MOVIMENTOSCAIXA_DINHEIRO;
							V_SALDOTRA = V_SALDOTRA + :MOVIMENTOSCAIXA_TRANSFERENCIAS;
							V_SALDOCHE = V_SALDOCHE + :MOVIMENTOSCAIXA_CHEQUE;
							V_SALDOCRE = V_SALDOCRE + :MOVIMENTOSCAIXA_CREDITO;
							V_SALDODEB = V_SALDODEB + :MOVIMENTOSCAIXA_DEBITO;
							V_SALDOCLJ = V_SALDOCLJ + :MOVIMENTOSCAIXA_CREDITOLOJA;
							V_SALDOCPE = V_SALDOCPE + :MOVIMENTOSCAIXA_CREDITOPESSOA;
							V_SALDOALI = V_SALDOALI + :MOVIMENTOSCAIXA_ALIMENTACAO;
							V_SALDOREF = V_SALDOREF + :MOVIMENTOSCAIXA_REFEICAO;
							V_SALDOPRE = V_SALDOPRE + :MOVIMENTOSCAIXA_PRESENTE;
							V_SALDOCMB = V_SALDOCMB + :MOVIMENTOSCAIXA_COMBUSTIVEL;                                              
							V_SALDODUP = V_SALDODUP + :MOVIMENTOSCAIXA_DUPLICATA;
							V_SALDOBOL = V_SALDOBOL + :MOVIMENTOSCAIXA_BOLETO;
							V_SALDOOUT = V_SALDOOUT + :MOVIMENTOSCAIXA_OUTRO;
							V_SALDOTRO = V_SALDOTRO - :MOVIMENTOSCAIXA_TROCO;
						end
				  else
					if (MOVIMENTOSCAIXA_TIPO = 'S') then
						begin
							V_SALDO    = V_SALDO    - :MOVIMENTOSCAIXA_TOTAL;
							V_SALDODIN = V_SALDODIN - :MOVIMENTOSCAIXA_DINHEIRO;
							V_SALDOTRA = V_SALDOTRA - :MOVIMENTOSCAIXA_TRANSFERENCIAS;
							V_SALDOCHE = V_SALDOCHE - :MOVIMENTOSCAIXA_CHEQUE;
							V_SALDOCRE = V_SALDOCRE - :MOVIMENTOSCAIXA_CREDITO;
							V_SALDODEB = V_SALDODEB - :MOVIMENTOSCAIXA_DEBITO;
							V_SALDOCLJ = V_SALDOCLJ - :MOVIMENTOSCAIXA_CREDITOLOJA;
							V_SALDOCPE = V_SALDOCPE - :MOVIMENTOSCAIXA_CREDITOPESSOA;
							V_SALDOALI = V_SALDOALI - :MOVIMENTOSCAIXA_ALIMENTACAO;
							V_SALDOREF = V_SALDOREF - :MOVIMENTOSCAIXA_REFEICAO;
							V_SALDOPRE = V_SALDOPRE - :MOVIMENTOSCAIXA_PRESENTE;
							V_SALDOCMB = V_SALDOCMB - :MOVIMENTOSCAIXA_COMBUSTIVEL;
							V_SALDODUP = V_SALDODUP - :MOVIMENTOSCAIXA_DUPLICATA;
							V_SALDOBOL = V_SALDOBOL - :MOVIMENTOSCAIXA_BOLETO;
							V_SALDOOUT = V_SALDOOUT - :MOVIMENTOSCAIXA_OUTRO;
							V_SALDOTRO = V_SALDOTRO + :MOVIMENTOSCAIXA_TROCO;
						end                            
				  MOVIMENTOSCAIXA_SALDO    = :V_SALDO;
				  SALDOS_DINHEIRO       = (:V_SALDODIN + :V_SALDOTRO);
				  SALDOS_TRANSFERENCIA  = :V_SALDOTRA;
				  SALDOS_CHEQUE         = :V_SALDOCHE;
				  SALDOS_CREDITO        = :V_SALDOCRE;
				  SALDOS_DEBITO         = :V_SALDODEB;
				  SALDOS_CREDITOLOJA    = :V_SALDOCLJ;
				  SALDOS_CREDITOPESSOA  = :V_SALDOCPE;
				  SALDOS_ALIMENTACAO    = :V_SALDOALI;
				  SALDOS_REFEICAO       = :V_SALDOREF;
				  SALDOS_PRESENTE       = :V_SALDOPRE;
				  SALDOS_COMBUSTIVEL    = :V_SALDOCMB;
				  SALDOS_DUPLICATA      = :V_SALDODUP;
				  SALDOS_BOLETO         = :V_SALDOBOL;
				  SALDOS_OUTRO          = :V_SALDOOUT;
				  SALDOS_TROCO          = :V_SALDOTRO;
				  if (MOVIMENTOSCAIXA_EMISSAO = '${emissao.replace (/\//ig,'.')}') then
					  suspend;
				end
			end;`;
		 
		db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
			}
		});
	});
}

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			getCaixa(params)
				.then(res => {
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					let docDefinition = {
						pageOrientation: 'portrait',
						pageSize: 'A4',               //   E   S   D   I
						pageMargins: [20, 40, 20, 35], // [40, 40, 40, 35]
						header: function(page, pages) { 
							return { 
								alignment: 'justify',
								columns: [
									{
										image: pathLogo,
										width: 100,
										height: 22,
										alignment: 'left'
									},
									{
										stack: [
											'Movimento do Caixa - ' + params.emissao + (params.status == 0 ? ' (Aberto)' : (params.status == 1 ? ' (Fechado)' : '')),
											res.results[0]['EMPRESAS_NOME']
										],
										width: '*',
										style: {
											fontSize: 11,
											alignment: 'center',
											color: 'red'
										}
									},
									{
										stack: [
											moment.tz(params.timezone).format('DD/MM/YYYY'),
											moment.tz(params.timezone).format('HH:mm:ss')
										],
										width: 100,
										style: {
											fontSize: 10,
											alignment: 'right',
											bold: true
										}
									}
								],
								margin: [40, 10]
							}
						},
						styles: {
							tableExample: {
								fontSize: 6, // 10
								margin: [0, 0, 0, 0],
								border: 0
							},
							tableHeader: {
								bold: true,
								fontSize: 6, // 10
								color: 'black'
							}
						},					
						content: [
							{columns: [{},{},{},{},{},{},{},{},{},{}]},
							{
								style: 'tableExample',
								table: {   //DH        HIS       VLR DOC ENT SAI SLD
			//						widths: [60, [    210     ], 40, 40, 40, 40, 40],  // agora tem 10 colunas
									widths: [60, 45, 45, 45, 45, 45, 40, 45, 45, 45],						
									headerRows: 1,
									body: [
										[
											{
												text: 'Data/Hora',
												style: 'tableHeader',
												alignment: 'center'									
											},
											{
												text: 'Histórico',
												style: 'tableHeader',
												alignment: 'center',
												colSpan : 4
											},{},{},{},
											{
												text: 'Valor',
												style: 'tableHeader',
												alignment: 'center'
											},
											{
												text: 'Documento',
												style: 'tableHeader',
												alignment: 'center'
											},
											{
												text: 'Entradas',
												style: 'tableHeader',
												alignment: 'center'
											},
											{
												text: 'Saídas',
												style: 'tableHeader',
												alignment: 'center'
											},
											{
												text: 'Saldo',
												style: 'tableHeader',
												alignment: 'center'
											}                                           
										]
									]
								},
								layout: {
									fillColor: function (i) {
										return (i % 2 === 0) ? '#E3E3E3' : null;
									}
								}
							}
						],
						footer: function(page, pages) { 
							return { 
								stack: [ 
									'_'.repeat(95),
									{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
								],
								margin: [40, 10]
							};
						},
						styles: {
							tableExample: {
								fontSize: 6, //10
								margin: [0, 0, 0, 0],
								border: 0
							},
							tableHeader: {
								bold: true,
								fontSize: 6, //10
								color: 'black'
							}
						}
					};

					let rows   = docDefinition.content[1].table.body;
					let sldAnterior      = 0,
						totLancamentos   = 0,
					    antDinheiro      = 0,
					    antCheque        = 0,
					    antCredito       = 0,
					    antDebito        = 0,
						antCreditoloja   = 0,
						antCreditopessoa = 0,
					    antAlimentacao   = 0,
						antRefeicao      = 0,
						antPresente      = 0,
						antCombustivel   = 0,
						antDuplicata     = 0,
						antBoleto        = 0,
						antOutro         = 0,
						totEntradas      = 0,
					    entDinheiro      = 0,
					    entCheque        = 0,
					    entCredito       = 0,
					    entDebito        = 0,
						entCreditoloja   = 0,
					    entCreditopessoa = 0,						
					    entAlimentacao   = 0,
						entRefeicao      = 0,
						entPresente      = 0,
						entCombustivel   = 0,
						entDuplicata     = 0,
						entBoleto        = 0,
						entOutro         = 0;

					let totSaidas        = 0,
					    saiDinheiro      = 0,
					    saiCheque        = 0,
					    saiCredito       = 0,
					    saiDebito        = 0,
						saiCreditoloja   = 0,
						saiCreditopessoa = 0,
					    saiAlimentacao   = 0,
						saiRefeicao      = 0,
						saiPresente      = 0,
						saiCombustivel   = 0,
						saiDuplicata     = 0,
						saiBoleto        = 0,
						saiOutro         = 0,
						impLinhas        = 0;						

					for(let i in res.results){
						let descriLancamento = res.results[i]['MOVIMENTOSCAIXA_ID_MOVIMENTOS'] > 0 ? (res.results[i]['DOCUMENTOS_NOME'] + ' ' + res.results[i]['MOVIMENTOS_NUMERO'] + ' - ') : '';
							descriLancamento += res.results[i]['MOVIMENTOSCAIXA_NOME'];

						let lanDinheiro      = res.results[i]['MOVIMENTOSCAIXA_DINHEIRO'],
						    lanTroco         = res.results[i]['MOVIMENTOSCAIXA_TROCO'],
							lanCheque        = res.results[i]['MOVIMENTOSCAIXA_CHEQUE'],
							lanCredito       = res.results[i]['MOVIMENTOSCAIXA_CREDITO'],
							lanDebito        = res.results[i]['MOVIMENTOSCAIXA_DEBITO'],
							lanCreditoloja   = res.results[i]['MOVIMENTOSCAIXA_CREDITOLOJA'],
							lanCreditopessoa = res.results[i]['MOVIMENTOSCAIXA_CREDITOPESSOA'],
							lanAlimentacao   = res.results[i]['MOVIMENTOSCAIXA_ALIMENTACAO'],
							lanRefeicao      = res.results[i]['MOVIMENTOSCAIXA_REFEICAO'],
							lanPresente      = res.results[i]['MOVIMENTOSCAIXA_PRESENTE'],
							lanCombustivel   = res.results[i]['MOVIMENTOSCAIXA_COMBUSTIVEL'],
							lanDuplicata     = res.results[i]['MOVIMENTOSCAIXA_DUPLICATA'],
							lanBoleto        = res.results[i]['MOVIMENTOSCAIXA_BOLETO'],
							lanOutro         = res.results[i]['MOVIMENTOSCAIXA_OUTRO'],
							lanSaldo         = res.results[i]['MOVIMENTOSCAIXA_SALDO'],
							lanTotal         = res.results[i]['MOVIMENTOSCAIXA_TOTAL'];

						rows.push([
							{
								text: moment(res.results[i]['MOVIMENTOSCAIXA_EMISSAO']).format('DD/MM/YYYY')
								 + ' ' + res.results[i]['MOVIMENTOSCAIXA_HORA'],
								style: {
									alignment: 'center'
								}									
                            },							
							{
								colSpan: 4,
								text: descriLancamento,
								style: {
									alignment: 'left'
								}									
                            },{},{},{},
							{
								text: utils.number.float2moeda(lanTotal),
								style: {
									alignment: 'right'
								}
							},
							{
								text: res.results[i]['MOVIMENTOS_NUMERO'],
								style: {
									alignment: 'right'
								}
							},
							{
								text: res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'E' ? utils.number.float2moeda(lanTotal) : '',
								style: {
									alignment: 'right'
								}
							},
							{
								text: res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'S' ? utils.number.float2moeda(lanTotal) : '',
								style: {
									alignment: 'right'
								}
							},
							{
								text: utils.number.float2moeda(lanSaldo),
								style: {
									alignment: 'right'
								}
                            }
						]);

						if(res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'E') {
							entDinheiro      += (lanDinheiro - lanTroco);
							entCheque        += lanCheque;
							entCredito       += lanCredito;
							entDebito        += lanDebito;
							entCreditoloja   += lanCreditoloja;
							entCreditopessoa += lanCreditopessoa;
							entAlimentacao   += lanAlimentacao;
							entRefeicao      += lanRefeicao;
							entPresente      += lanPresente;
							entCombustivel   += lanCombustivel;
							entDuplicata     += lanDuplicata;
							entBoleto        += lanBoleto;
							entOutro         += lanOutro;
							totEntradas      += lanTotal;
							totLancamentos   += lanTotal;
						} else if(res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'S') {
							saiDinheiro      += (res.results[i]['MOVIMENTOSCAIXA_NOME'].match(/FECHAMENTO/) ? 0 : (lanDinheiro - lanTroco));
							saiCheque        += lanCheque;
							saiCredito       += lanCredito;
							saiDebito        += lanDebito;
							saiCreditoloja   += lanCreditoloja;
							saiCreditopessoa += lanCreditopessoa;
							saiAlimentacao   += lanAlimentacao;
							saiRefeicao      += lanRefeicao;
							saiPresente      += lanPresente;
							saiCombustivel   += lanCombustivel;
							saiDuplicata     += lanDuplicata;
							saiBoleto        += lanBoleto;
							saiOutro         += lanOutro;
							totSaidas        += lanTotal;
							totLancamentos   -= lanTotal;
						}
						
					}

					rows.push([
						{
							colSpan: 5,
							text: 'Totais do dia',
							fontSize: 8,
							style: {
								alignment: 'right'
							}									
						},{},{},{},{},
						{
							text: utils.number.float2moeda(totLancamentos),
							style: {
								alignment: 'right',
								bold: true								
							}
						},
						{
							text: '',
							style: {
								alignment: 'right'
							}
							
						},						
						{
							text: utils.number.float2moeda(totEntradas),
							style: {
								alignment: 'right',
								bold: true						
							}
						},
						{
							text: utils.number.float2moeda(totSaidas),
							style: {
								alignment: 'right',
								bold: true
							}
							
						},
						{
							text: '',
							style: {
								alignment: 'right'
							}
						}
					]);

					rows.push([
						{
							colSpan: 5,
							text: 'Detalhes do Saldo',
							fontSize: 8,
							style: {
								alignment: 'center'
							}									
						},{},{},{},{},
						{
							colSpan: 3,
							text: 'Saldo Anterior',
							fontSize: 8,							
							style: {
								alignment: 'right'
							}
						},{},{},
						{
							colSpan: 2,
							text: utils.number.float2moeda(sldAnterior),
							fontSize: 8,							
							style: {
								alignment: 'right'
							}
						},{},
					]);

					rows.push([
						{
							text: 'Totalizadores',
							style: {
								alignment: 'center'
							}
						},							
						{
							text: 'Anterior',
							style: {
								alignment: 'right'
							}							
						},
						{
							text: 'Entrada',
							style: {
								alignment: 'right'
							}							
						},
						{
							text: 'Saída',
							style: {
								alignment: 'right'
							}
						},						
						{
							text: 'Saldo',
							style: {
								alignment: 'right'
							}
						},
						{
							colSpan: 3,
							text: 'Saldo Atual',
							fontSize: 8,
							style: {
								alignment: 'right'
							}							
						},{},{},
						{
							colSpan: 2,
							text: utils.number.float2moeda(sldAnterior + totEntradas - totSaidas),
							fontSize: 8,
							style: {
								alignment: 'right'
							}
						},{}
					]);

					if ((antDinheiro + entDinheiro + saiDinheiro) != 0) {
						rows.push([
							{
								text: 'Dinheiro',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antDinheiro) || '0,00',  // Anterior Dinheiro
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entDinheiro) || '0,00',  // Entrada Dinheiro
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiDinheiro) || '0,00',  // Saída Dinheiro,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda(antDinheiro + entDinheiro - saiDinheiro) || '0,00',  // Saldo Dinheiro,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: 'CAIXA',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: 'VISTO',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;					
					}

					if ((antCheque + entCheque + saiCheque) > 0) {
						rows.push([
							{
								text: 'Cheque',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCheque) || '0,00',  // Anterior Cheque
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCheque) || '0,00',  // Entrada Cheque
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCheque) || '0,00',  // Saída Cheque
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda(antCheque + entCheque - saiCheque) || '0,00',  // Saldo Cheques,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}							
						]);
						impLinhas++;
					}

					if ((antCredito + entCredito + saiCredito) > 0) {
						rows.push([
							{
								text: 'Cartão Crédito',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCredito) || '0,00',  // Anterior C. Crédito
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCredito) || '0,00',  // Entrada C. Crédito
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCredito) || '0,00',  // Saída C. Crédito,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda(antCredito + entCredito - saiCredito) || '0,00',  // Saldo C. Credito,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}																						
						]);
						impLinhas++;
					}

					if ((antDebito + entDebito + saiDebito) > 0) {
						rows.push([
							{
								text: 'Cartão Débito',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antDebito) || '0,00',  // Anterior C. Débito
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entDebito) || '0,00',  // Entrada C. Débito
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiDebito) || '0,00',  // Saída C. Débito,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda(antDebito + entDebito - saiDebito) || '0,00',  // Saldo C. Debito,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antCreditoloja + entCreditoloja + saiCreditoloja) > 0) {					
						rows.push([
							{
								text: 'Crédito Loja',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCreditoloja) || '0,00',  // Anterior Crédito Loja
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCreditoloja) || '0,00',  // Entrada Crédito Loja
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCreditoloja) || '0,00',  // Saída Crédito Loja,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antCreditoloja + entCreditoloja - saiCreditoloja)) || '0,00',  // Saldo C. Credito,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++
					}

					if ((antCreditopessoa + entCreditopessoa + saiCreditopessoa) > 0) {
						rows.push([
							{
								text: 'Crédito Pessoa',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCreditopessoa) || '0,00',  // Anterior Crédito pessoa
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCreditopessoa) || '0,00',  // Entrada Crédito Pessoa
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCreditopessoa) || '0,00',  // Saída Crédito pessoa,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antCreditopessoa + entCreditopessoa - saiCreditopessoa)) || '0,00',  // Saldo Credito Pessoa,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++
					}

					if ((antAlimentacao + entAlimentacao + saiAlimentacao) > 0) {					
						rows.push([
							{
								text: 'Alimentação',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antAlimentacao) || '0,00',  // Anterior C. Alimentação
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entAlimentacao) || '0,00',  // Entrada C. Alimentação
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiAlimentacao) || '0,00',  // Saída C. Alimentação,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antAlimentacao + entAlimentacao - saiAlimentacao)) || '0,00',  // Saldo C. Alimentacao,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++
					}

					if ((antRefeicao + entRefeicao + saiRefeicao) > 0) {
						rows.push([
							{
								text: 'Refeição',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antRefeicao) || '0,00',  // Anterior Refeição
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entRefeicao) || '0,00',  // Entrada Refeição
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiRefeicao) || '0,00',  // Saída Refeição,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antRefeicao + entRefeicao - saiRefeicao)) || '0,00',  // Saldo Refeição
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antPresente + entPresente + saiPresente) > 0) {
						rows.push([
							{
								text: 'Presente',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antPresente) || '0,00',  // Anterior Presente
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entPresente) || '0,00',  // Entrada Presente
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiPresente) || '0,00',  // Saída Presente
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antPresente + entPresente - saiPresente)) || '0,00',  // Saldo Presente
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antCombustivel + entCombustivel + saiCombustivel) > 0) {
						rows.push([
							{
								text: 'Combustível',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCombustivel) || '0,00',  // Anterior Combustível
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCombustivel) || '0,00',  // Entrada Combustível
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCombustivel) || '0,00',  // Saída Combustível
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antCombustivel + entCombustivel - saiCombustivel)) || '0,00',  // Saldo Combustivel,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antDuplicata + entDuplicata + saiDuplicata) > 0) {					
						rows.push([
							{
								text: 'Duplicata',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antDuplicata) || '0,00',  // Anterior Duplicata
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entDuplicata) || '0,00',  // Entrada Duplicata
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiDuplicata) || '0,00',  // Saída Duplicata,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antDuplicata + entDuplicata - saiDuplicata)) || '0,00',  // Saldo Duplicata
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}
					
					if ((antBoleto + entBoleto + saiBoleto) > 0) {
						rows.push([
							{
								text: 'Boleto',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antBoleto) || '0,00',  // Anterior Boleto
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entBoleto) || '0,00',  // Entrada Boleto
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiBoleto) || '0,00',  // Saída Boleto
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antBoleto + entBoleto - saiBoleto)) || '0,00',  // Saldo Boleto
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antOutro + entOutro + saiOutro) > 0) {
						rows.push([
							{
								text: 'Outro',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antOutro) || '0,00',  // Anterior Outro
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entOutro) || '0,00',  // Entrada Outro
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiOutro) || '0,00',  // Saída Outro,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antOutro + entOutro - saiOutro)) || '0,00',  // Saldo Outro,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}
// Soma dos Totalizadores

					rows.push([
						{
							text: 'TOTAL',
							style: {
								bold: true,
								alignment: 'left'
							}									
						},							
						{
							text: utils.number.float2moeda((antDinheiro  + antCheque        + antCredito  + antDebito   +
								                          antCreditoloja + antCreditopessoa + antAlimentacao + antRefeicao + antPresente +
								                          antCombustivel + antDuplicata   + antBoleto   + antOutro)) || '0,00',  // Anterior
							style: {
								alignment: 'right'
							}							
						},
						{
							text: utils.number.float2moeda((entDinheiro  + entCheque        + entCredito     + entDebito   +
							                              entCreditoloja + entCreditopessoa + entAlimentacao + entRefeicao + entPresente +
								                          entCombustivel + entDuplicata     + entBoleto      + entOutro)) || '0,00',  // Entradas

							style: {
								alignment: 'right'
							}							
						},
						{
							text: utils.number.float2moeda((saiDinheiro  + saiCheque        + saiCredito  + saiDebito   +
								                          saiCreditoloja + saiCreditopessoa + saiAlimentacao + saiRefeicao + saiPresente +
								                          saiCombustivel + saiDuplicata     + saiBoleto   + saiOutro)) || '0,00', // Saidas
							style: {
								alignment: 'right'
							}
						},						
						{
							text: utils.number.float2moeda(((antDinheiro  + antCheque        + antCredito  + antDebito +
							                               antCreditoloja + antCreditopessoa + antAlimentacao + antRefeicao + antPresente +
								                           antCombustivel + antDuplicata     + antBoleto   + antOutro)	+
								                          (entDinheiro    + entCheque        + entCredito  + entDebito   +
                                						   entCreditoloja + entCreditopessoa + entAlimentacao + entRefeicao + entPresente +
								                           entCombustivel + entDuplicata     + entBoleto   + entOutro)   -
								                          (saiDinheiro    + saiCheque        + saiCredito  + saiDebito   +
					                             	       saiCreditoloja + saiCreditopessoa + saiAlimentacao + saiRefeicao + saiPresente +
								                           saiCombustivel + saiDuplicata     + saiBoleto   + saiOutro))) || '0,00', // Saldo
								                          
							style: {
								alignment: 'right'
							}
						},
						{
							colSpan: 3,
							text: impLinhas == 0 ? 'CAIXA': '',
							fontSize: 8,								
							border: [false, false, true, true],
							style: {
								alignment: 'left'
							}							
						},{},{},
						{
							colSpan: 2,
							text: impLinhas == 0 ? 'VISTO': '',
							fontSize: 8,
							border: [false, false, true, true],
							style: {
								alignment: 'left'
							}
						},{}
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};