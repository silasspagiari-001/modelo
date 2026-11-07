'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
  read: params => {

    const box = {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5
    };

    let docDefinition = {
      pageSize: 'A4',
      pageMargins: [20, 20, 20, 20],
      defaultStyle: { fontSize: 9 },
      content: []
    };

    return new Promise((resolve, reject) => {

      api.financeiros().readById(params.ids, params)
        .then(res => {

          let pathLogo;
          try {
            pathLogo = utils.client.getImagePath(
              `logos/nfe/${res.results[0]['EMPRESAS_CPFCNPJ']}.png`, params
            );
          } catch {
            pathLogo = `${appRoot}/resources/images/nfe/default.png`;
          }

          res.results.forEach((model, idx) => {

            if (idx > 0) docDefinition.content.push({ text: '', pageBreak: 'before' });

            const emiTitulo = moment(model['FINANCEIROS_EMISSAO']).isValid()
              ? moment(model['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY') : '';

            const vctTitulo = moment(model['FINANCEIROS_VENCIMENTO']).isValid()
              ? moment(model['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '';

            const total = model['FINANCEIROS_ABERTO'] || model['FINANCEIROS_PAGO'];

            const nomeEmpresa = model['EMPRESAS_NOME'];
            const telefoneEmpresa = utils.string.maskFone(model['EMPRESAS_TELEFONE']);
            const celularEmpresa  = model['EMPRESAS_CELULAR'];
            const email = model['EMPRESAS_EMAIL'];

            const endereco = model['EMPRESAS_ENDERECO'];
            const numero   = model['EMPRESAS_NUMERO'];
            const bairro   = model['EMPRESAS_BAIRRO'];
            const cidade   = model['CIDADES_NOME'];
            const estado   = model['CIDADES_ESTADO'];
            const cep      = utils.string.maskCep(model['EMPRESAS_CEP']);

            const cpfcnpj = utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']);
            const inscricaoEstadual = model['EMPRESAS_INSCRICAO'];

            const nomePessoa = model['PESSOAS_NOME'];
            const enderecoPessoa = model['PESSOAS_ENDERECO'];
            const numeroPessoa = model['PESSOAS_NUMERO'];
            const bairroPessoa = model['PESSOAS_BAIRRO'];
            const cidadePessoa = model['PESSOAS_CIDADES'];
            const estadoPessoa = model['PESSOAS_ESTADO'];
            const cepPessoa = utils.string.maskCep(model['PESSOAS_CEP']);
            const cpfcnpjPessoa = utils.string.maskCnp(model['PESSOAS_CPFCNPJ']);
            const rgInscricaoPessoa = model['PESSOAS_INSCRICAO'];

            /* ===== CABEÇALHO ===== */
            docDefinition.content.push({
              table: {
                widths: ['100%'],
                body: [[
                  {
                    table: {
                      widths: [100, '*'],
                      body: [[
                        { image: pathLogo, width: 100, alignment: 'center' },

                        { table: {
                            widths: ['28%', '*'],
                            body: [
                            [{ text: 'Empresa: ', bold: false, fontSize: 10, alignment: 'right',lineHeight: 0.8,border: [false, false, false, false]},{ text: `${nomeEmpresa}`, bold: true, fontSize: 12,lineHeight: 0.8, border: [false, false, false, false]}],
                            [{ text: 'Endereço: ', bold: false, fontSize: 10,alignment: 'right',lineHeight: 0.8,border: [false, false, false, false]},{ text: `${endereco}, ${numero} - ${bairro}`, bold: true, fontSize: 12,lineHeight: 0.8,border: [false, false, false, false]}],
                            [{ text: 'Município: ', bold: false, fontSize: 10,alignment: 'right',lineHeight: 0.8,border: [false, false, false, false]},{ text: `${cep} - ${cidade}/${estado}`, bold: true, fontSize: 12,lineHeight: 0.8,border: [false, false, false, false]}],
                            [{ text: 'CNPJ/CPF - Inscrição: ', bold: false, fontSize: 10,alignment: 'right',lineHeight: 0.8,border: [false, false, false, false]},{ text: `${cpfcnpj}   -   ${inscricaoEstadual}`, bold: true, fontSize: 12,lineHeight: 0.8,border: [false, false, false, false]}],

                            ],								
                        },
                       },
                      ]]
                    },
                    layout: box
                  },
                ]]
              },
              layout: box
            });

            /* ===== VALOR / VENCIMENTO ===== */
            docDefinition.content.push({
              margin: [0, 6, 0, 0],
              table: {
                widths: ['25%', '25%', '25%', '25%'],
                body: [
                  ['Valor', 'Nº Ordem', 'Emissão', 'Vencimento'],
                  [
                    `R$ ${utils.number.float2moeda(total)}`,
                    `${model['FINANCEIROS_NUMERO']}/${model['FINANCEIROS_PARCELA']}`,
                    emiTitulo,vctTitulo
                    
                  ]
                ]
              },
              layout: box
            });

            docDefinition.content.push({
              margin: [0, 6, 0, 0],
              table: {
                widths: ['22%', '73%'],
                body: [
                  [{ text: 'NOME DO SACADO: ', bold: true, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]},{ text: `${nomePessoa}`, bold: false, fontSize: 10,lineHeight: 0.8, border: [false, false, false, false]}],
                  [{ text: 'ENDEREÇO: ', bold: true, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]},{ text: `${enderecoPessoa}, ${numeroPessoa} - ${bairroPessoa}`, bold: false, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]}],
                  [{ text: 'MUNICÍPIO: ', bold: true, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]},{ text: `${cidadePessoa}, ${estadoPessoa} - ${cepPessoa} `, bold: false, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]}],
                  [{ text: 'CNPJ/CPF - INSCRIÇÃO: ', bold: true, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]},{ text: `${cpfcnpjPessoa}   -   ${rgInscricaoPessoa} `, bold: false, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]}],

                ],								
              },
           //   layout: box
            });

            /* ===== VALOR POR EXTENSO ===== */
            docDefinition.content.push({
              margin: [0, 6, 0, 0],
              table: {
                widths: [140, '*'],
                body: [[
                  'VALOR POR EXTENSO',
                  `R$ ${utils.number.float2moeda(total)} (${utils.number.ValorPorExtenso(total)})`
                ]]
              },
              layout: box
            });

            /* ===== ACEITE ===== */
            docDefinition.content.push({
              margin: [0, 8, 0, 0],
              table: {
                widths: ['*'],
                body: [
                  [{
                    text:
                      `RECONHEÇO(EMOS) A EXATIDÃO DESTA DUPLICATA DE VENDA MERCANTIL, ` +
                      `NA IMPORTÂNCIA ACIMA QUE PAGAREI(EMOS) À ${nomeEmpresa}, ` +
                      `OU À SUA ORDEM NA PRAÇA E VENCIMENTO INDICADOS.`,
                    alignment: 'center',
                    fontSize: 8
                  }],
                  [{
                    margin: [0, 15, 0, 0],
                    table: {
                      widths: ['*', '*'],
                      body: [[
                        '_____/_____/_______\nDATA DO ACEITE',
                        '________________________________________\nASSINATURA DO SACADO'
                      ]]
                    },
                    layout: 'noBorders'
                  }]
                ]
              },
              layout: box
            });


                    docDefinition.content.push(
                        [
                            {
                                text: '.',
                                style: 'tableHeader',
                                alignment: 'right',
                                colSpan: 4,
                                lineHeight: 4									
                            },{},{},{},
                            {
                                text: '.',
                                style: 'tableHeader',
                                alignment: 'right',
                                lineHeight: 4									
                            }
                        ]
                    );					
                    




            docDefinition.content.push({
              margin: [0, 6, 0, 0],
              table: {
                widths: ['25%', '25%', '25%', '25%'],
                body: [
                  ['Valor', 'Nº Ordem', 'Emissão', 'Vencimento'],
                  [
                    `R$ ${utils.number.float2moeda(total)}`,
                    `${model['FINANCEIROS_NUMERO']}/${model['FINANCEIROS_PARCELA']}`,
                    emiTitulo,vctTitulo
                    
                  ]
                ]
              },
              layout: box
            });

            docDefinition.content.push({
              margin: [0, 6, 0, 0],
              table: {
                widths: ['22%', '73%'],
                body: [
                  [{ text: 'NOME DO SACADO: ', bold: true, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]},{ text: `${nomePessoa}`, bold: false, fontSize: 10,lineHeight: 0.8, border: [false, false, false, false]}],
                  [{ text: 'ENDEREÇO: ', bold: true, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]},{ text: `${enderecoPessoa}, ${numeroPessoa} - ${bairroPessoa}`, bold: false, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]}],
                  [{ text: 'MUNICÍPIO: ', bold: true, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]},{ text: `${cidadePessoa}, ${estadoPessoa} - ${cepPessoa} `, bold: false, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]}],
                  [{ text: 'CNPJ/CPF - INSCRIÇÃO: ', bold: true, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]},{ text: `${cpfcnpjPessoa}   -   ${rgInscricaoPessoa} `, bold: false, fontSize: 10,lineHeight: 0.8,border: [false, false, false, false]}],

                ],								
              },
           //   layout: box
            });

            /* ===== VALOR POR EXTENSO ===== */
            docDefinition.content.push({
              margin: [0, 6, 0, 0],
              table: {
                widths: [140, '*'],
                body: [[
                  'VALOR POR EXTENSO',
                  `R$ ${utils.number.float2moeda(total)} (${utils.number.ValorPorExtenso(total)})`
                ]]
              },
              layout: box
            });




          });

          pdfStream(docDefinition, resolve, reject);
        })
        .catch(reject);
    });
  }
};
