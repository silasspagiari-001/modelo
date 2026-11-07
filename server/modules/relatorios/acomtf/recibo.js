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
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			background: [
				{
					image: `${appRoot}/resources/images/marcasdagua/recibo.png`,
					width: 600 // 792
				}
			],						
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
			getCaixa(params)
				.then(res => {
					let rows   = docDefinition.content[1].table.body;
					let pagNome    = '',
					    pagTotal   = 0,
						pagTdc     = '',
						pagCpfcnpj = '',
						recNome    = '',
						recTdc     = '',
						recCpfcnpj = '';

//					for (let vias = 0; vias < 2; vias++) {

						for(let i in res.results){

							// Dados Pagador/Recebedor
							if(res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'E') {
								pagNome    = res.results[i]['PESSOAS_NOME'];
								pagCpfcnpj = res.results[i]['PESSOAS_CPFCNPJ'];
								recNome    = res.results[i]['EMPRESAS_NOME'];
								recCpfcnpj = res.results[i]['EMPRESAS_CPFCNPJ'];
							} else {
								pagNome    = res.results[i]['EMPRESAS_NOME'];
								pagCpfcnpj = res.results[i]['EMPRESAS_CPFCNPJ'];
								recNome    = res.results[i]['PESSOAS_NOME'];
								recCpfcnpj = res.results[i]['PESSOAS_CPFCNPJ'];
							}

							pagTotal = (res.results[i]['MOVIMENTOSCAIXA_TOTAL'] - res.results[i]['MOVIMENTOSCAIXA_DUPLICATA']);
							pagTdc   = (pagCpfcnpj.length == 11 ? 'CPF' : 'CNPJ');
							recTdc   = (recCpfcnpj.length == 11 ? 'CPF' : 'CNPJ');

							rows.push([
								{
									text: 'Referência',
									fontSize: 10,
									style: 'tableHeader',
									alignment: 'left'
								},
								{
									colSpan: 4,
									text: 'Recibo',
									fontSize: 20,
									style: 'tableHeader',
									alignment: 'center'
								},{},{},{},
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
									colSpan: 3,
									text: [
										{
											text: 'Pagador:\n',
											fontSize: 10, 
											alignment: 'left'
										},
										{
											text:  `${pagNome}\n`,
											alignment: 'left',
											style: {
												bold: true,
												fontSize: 12
											}
										},
										{
											text:  `${pagTdc}: ${utils.string.maskCnp(pagCpfcnpj)}\n`,
											alignment: 'left',
											style: {
												bold: true,
												fontSize: 12
											}
										}									
									]
								},{},{},
								{
									colSpan: 3,
									text: [
										{
											text: 'Recebedor:\n',
											fontSize: 10, 
											alignment: 'left'
										},
										{
											text: `${recNome}\n`,
											alignment: 'left',
											style: {
												bold: true,
												fontSize: 12
											}
										},
										{
											text:  `${recTdc}: ${utils.string.maskCnp(recCpfcnpj)}\n`,
											alignment: 'left',
											style: {
												bold: true,
												fontSize: 12
											}
										}
									]	
								},{},{}
							]);
							rows.push([
								{
									colSpan: 6,
									text:  `Recebi(emos) de ${pagNome}, ${pagTdc} nº ${utils.string.maskCnp(pagCpfcnpj)},
											a importância de R$ ${utils.number.float2moeda(pagTotal)} (${utils.number.ValorPorExtenso(pagTotal)}) referente a ${res.results[i]['MOVIMENTOSCAIXA_NOME']}
											
											
											
											`,
									alignment: 'justify',
									style: {
										bold: true,
										fontSize: 12
									}
								}
							]);
							rows.push([
								{
									colSpan: 3,
									text: [
										{
											text: 'Pago por:\n\n\n',
											fontSize: 10, 
											alignment: 'left'
										},
										{
											text:  '_______________________________________________________\n\n\n\n',
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 10
											}
										},
										{
											text:  'Assinatura:____________________________________________',
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 10
											}
										}									
									]
								},{},{},
								{
									colSpan: 3,
									text: [
										{
											text: 'Recebido por:\n\n\n',
											fontSize: 10, 
											alignment: 'left'
										},
										{
											text:  '_______________________________________________________\n\n\n\n',
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 10
											}
										},
										{
											text:  'Assinatura:____________________________________________',
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 10
											}
										}									
									]
								},{},{}
							]);

							rows.push([
								{
									text: `\n\n${res.results[i]['CIDADES_NOME']}, ${res.results[i]['CIDADES_ESTADO']}, __________ de ___________________ de ___________`,
									colSpan: 5,
									fontSize: 12, 
									alignment: 'left',
									border: [true, false, true, true]
								},{},{},{},{},
								{
									text: '\n', // (vias == 0 ? '\n1ª via - Pagador\n' : '\n2ª via - Recebedor\n'),
									fontSize: 10,
									alignment: 'center',
									border: [true, false, true, true]
								},
							]);

							rows.push([ //Linha em branco
								{
									text: ' ',
									colSpan: 5,
									border: [false, false, false, false]
								},{},{},{},{},
								{
									text: ' ',
									border: [false, false, false, false]
								}
							]);													

							rows.push([ //fechando a tabela e colocando uma linha em branco para recorte.
								{
									text: ' ',
									colSpan: 5,
									border: [false, true, false, false] // (vias == 0 ? [false, true, false, false] : [false, false, false, false]),
								},{},{},{},{},
								{
									text: ' ',
									border: [false, true, false, false] // (vias == 0 ? [false, true, false, false] : [false, false, false, false]),
								}
							]);													
							
							
						};
//					};

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	},
		
};
