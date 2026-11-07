'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const moment    = require('moment-timezone');
const mkdirp    = require('mkdirp');
const utils     = require('../../services/samosUtils');
const cents     = utils.number.cents.bind(utils.number);
const grams     = utils.number.grams.bind(utils.number);
const strZero   = utils.number.strZero.bind(utils.number);

moment.locale('pt_BR');

const samosFB = require('../../services/samosFirebird'); 

module.exports = {
    read: async params => { 
        const db = await samosFB.conectarBanco(params.client); 
        const nomeArquivo = 'BLOCOK_' + strZero(params.mes, 2) + params.ano.toString() + '_' + (params.client || 'teste');
        let conteudo = '';

        let dadosProduto = await obterDadosProdutos(db, params); // Registro 14 - Cadastro de produtos - Concluído OK
        let idEmpresa = params.cnpj == '05971492000186' ? 172 : 428;  // Código da empresa no alterdata (172 - Biomart, 428 - Organoplant)

        for(let i in dadosProduto) {

            let model    = dadosProduto[i];
            let codPro  = strZero(model['PRODUTOS_ID'], 9);
            let uniPro  = await descUni(model['PRODUTOS_UNIDADE'], params.unidades);
            let tipoPro = await tipoProduto(model['PRODUTOS_ID_GRUPOS']);
            let nomePro = model['PRODUTOS_NOME'].length > 53 ? model['PRODUTOS_NOME'].slice(0, 53) : model['PRODUTOS_NOME'].trim().padEnd(53);
                                                                        // DE ATÉ TAM
            conteudo += "014";                                          // 001 003 003 Fixo
            conteudo += strZero(idEmpresa, 5);                          // 004 008 005 DIPI (Cod Empresa)
            conteudo += (model['NCMS_NCM']).padEnd(20);                 // 009 028 020 NBM/SH
            conteudo += codPro;                                         // 029 037 009 Código do Produto
            conteudo += nomePro;                                        // 038 090 053 Descrição do Produto
            conteudo += ' '.padEnd(20);                                 // 091 110 020 Descrição complementar (em branco)
            conteudo += ' '.padEnd(14);                                 // 111 124 014 Código específico (não tem)
            conteudo += (model['PRODUTOS_BARRA'] || ' ').padEnd(14);    // 125 138 014 Código EAN (Barras)
            conteudo += tipoPro;                                        // 139 140 002 Tipo de Produto (Tabela anexa manual)
            conteudo += (model['PRODUTOS_UNIDADE']).trim().padEnd(3);   // 141 143 003 Unidade do produto
            conteudo += (uniPro).padEnd(30);                            // 144 173 030 Descrição da unidade
            conteudo += (model['PRODUTOS_UNIDADE']).trim().padEnd(3);   // 174 176 003 Unidade do produto no estoque
            conteudo += (uniPro).trim().padEnd(30);                     // 177 206 030 Descrição da unidade do produto no estoque
            conteudo += "0".repeat(18);                                 // 207 224 018 Fator de conversão (não tem, preenchido com zeros)
            conteudo += model['NCMS_NCM'].slice(0, 2);                  // 225 226 002 Código do gênero do produto
            conteudo += (" ").padEnd(100);                              // 227 326 100 Descrição do gênero do Produto
            conteudo += (" ").padEnd(2);                                // 327 328 002 Brancos
            conteudo += "55";                                           // 329 330 002 CST IPI
            conteudo += "01";                                           // 331 332 002 CST COFINS Entrada
            conteudo += "01";                                           // 333 334 002 CST COFINS Saida
            conteudo += "01";                                           // 335 336 002 CST PIS Entrada
            conteudo += "01";                                           // 337 338 002 CST PIS Saida
            conteudo += "N";                                            // 339 339 001 Selo IPI (Somente Bebidas Alcoólicas)
            conteudo += " ".padEnd(6);                                  // 340 345 006 Brancos
            conteudo += "0".repeat(12);                                 // 346 357 012 Quantidade de Selo IPI Aplicado (zeros)
            conteudo += strZero(cents(model['SALDOS_ICMSLC']), 5);      // 358 362 005 Aliquota ICMS Local
            conteudo += "0".repeat(5);                                  // 363 367 005 Aliquota Diferenciada do PIS
            conteudo += "0".repeat(5);                                  // 368 372 005 Aliquota Diferenciada do COFINS
            conteudo += "0".repeat(9);                                  // 373 381 009 Código ANP
            conteudo += "0".repeat(10);                                 // 382 391 010 Código Anterior do Item
            conteudo += " ".padEnd(14);                                 // 392 405 014 Código específico anterior
            conteudo += model['SALDOS_CSTLOCAL'];                       // 406 408 003 CST Icms
            conteudo += "0".repeat(7);                                  // 409 415 007 Aliquota Diferenciada do PIS            
            conteudo += "0".repeat(7);                                  // 416 422 007 Aliquota Diferenciada do COFINS
            conteudo += " ".padEnd(6);                                  // 423 428 006 Unidade, só preencher se pos 141 estiver vazia
            conteudo += " ".padEnd(6);                                  // 429 434 006 Unidade, só preencher se pos 174 estiver vazia
            conteudo += " ".padEnd(2);                                  // 435 436 002 Identificador da tabela de unidade de medida (Só pra PIS/COFINS 03)
            conteudo += " ".padEnd(2);                                  // 437 438 002 Identificador da tabela de grupo (Só pra PIS/COFINS 03)
            conteudo += " ".padEnd(50);                                 // 439 488 050 Marca comercial (Só pra PIS/COFINS 03)
            conteudo += " ".padEnd(6);                                  // 489 494 006 Unidade de Medida (Só pra PIS/COFINS 03)
            conteudo += " ".padEnd(30);                                 // 495 524 030 Descrição da unidade de medida (Só pra PIS/COFINS 03)
            conteudo += "0".repeat(18);                                 // 525 542 018 Fator de conversão (Só pra PIS/COFINS 03)
            conteudo += "0".repeat(8);                                  // 543 550 008 Data código anterior (se cód alterado)
            conteudo += " ".padEnd(60);                                 // 551 610 060 Código específico
            conteudo += " ".padEnd(60);                                 // 611 670 060 Código específico anterior
            conteudo += " ".padEnd(1);                                  // 671 671 001 Aliq. Diferenciada IRPJ Combustível
            conteudo += "000";                                          // 672 674 003 Natureza Receita PIS/COFINS CST 04
            conteudo += "000";                                          // 675 677 003 Natureza Receita PIS/COFINS CST 05
            conteudo += "000";                                          // 678 680 003 Natureza Receita PIS/COFINS CST 06
            conteudo += "000";                                          // 681 683 003 Natureza Receita PIS/COFINS CST 07
            conteudo += "000";                                          // 684 686 003 Natureza Receita PIS/COFINS CST 08
            conteudo += "000";                                          // 687 689 003 Natureza Receita PIS/COFINS CST 09
            conteudo += model['NCMS_CEST'].trim().padEnd(7)             // 690 696 007 Código CEST
            conteudo += " ".padEnd(14);                                 // 697 710 014 Código de Barras fator comissão
            conteudo += '\n';                                           // Teste, CRLF
        }
      
        let dadosItensProduzidos = await obterDadosItensProduzidos(db, params);

        const dtaIni = moment(`${params.ano}-${params.mes}-01`).format('DDMMYYYY');
        const dtaFin = moment(`${params.ano}-${params.mes}-01`).add(1, 'month').subtract(1, 'day').format('DDMMYYYY');

        for(let i in dadosItensProduzidos) {

            let model = dadosItensProduzidos[i];
            let qtdeProduzida = grams(grams((grams(model['PRODUCOES_QUANTIDADE']) / grams(model['PRODUTOS_EMBALAGEM'])))) // com 6 decimais
            let dtpIni = moment(model['PRODUCOES_INICIO']).format('DDMMYYYY');
            let dtpFin = moment(model['PRODUCOES_FINALIZADA']).format('DDMMYYYY');

            conteudo += "024";                                          // 001 003 003 Fixo '024'
            conteudo += strZero(idEmpresa, 5);                          // 004 008 005 Código da empresa no AlterData
            conteudo += dtaIni;                                         // 009 016 008 Data inicio apuração
            conteudo += dtaFin;                                         // 017 024 008 Data final apuração
            conteudo += "K230";                                         // 025 028 004 Fixo 'K230'
            conteudo += dtpIni;                                         // 029 036 008 Data inicio OrdemProdução
            conteudo += dtpFin;                                         // 037 044 008 Data final OrdemProdução
            conteudo += strZero(model['PRODUCOES_NUMERO'], 30);         // 045 074 030 Código da ordem de produção
            conteudo += strZero(model['PRODUCOES_ID_PRODUTOS'], 9);     // 075 083 009 Código do item produzido
            conteudo += " ".padEnd(60);                                 // 084 143 060 Código específico do item produzido
            conteudo += strZero(qtdeProduzida, 16);                     // 144 159 016 Quantidade produção acabada (6 decimais)
            conteudo += '\n';
        }

        let dadosItensConsumidos = await obterDadosItensConsumidos(db, params);

        for(let i in dadosItensConsumidos) {

            let model = dadosItensConsumidos[i];
            let qtdeConsumida = grams(grams((grams(model['PRODUCOESITENS_QUANTIDADE']) / grams(model['PRODUTOS_EMBALAGEM'])))) // com 6 decimais
            let dtsIni = moment(model['PRODUCOES_INICIO']).format('DDMMYYYY');
            let dtpFin = moment(model['PRODUCOES_FINALIZADA']).format('DDMMYYYY');

            conteudo += "025";                                          // 001 003 003 Fixo '024'
            conteudo += strZero(idEmpresa, 5);                          // 004 008 005 Código da empresa no alterData
            conteudo += dtaIni;                                         // 009 016 008 Data inicio apuração
            conteudo += dtaFin;                                         // 017 024 008 Data final apuração
            conteudo += "K235";                                         // 025 028 004 Fixo 'K235'
            conteudo += dtsIni;                                         // 029 036 008 Data Saída estoque pra produção
            conteudo += strZero(model['PRODUCOESITENS_ID_PRODUTOS'], 9);// 037 045 009 Código do item (Produto consumido)
            conteudo += ' '.padEnd(60);                                 // 046 105 060 Código específico (não tem)
            conteudo += strZero(qtdeConsumida, 16);                     // 106 121 016 Quantidade consumida do item (6 decimais)
            conteudo += '000000000';                                    // 122 130 009 Código do insumo que foi substituido (não tem)
            conteudo += ' '.padEnd(60);                                 // 131 190 060 Código específico do insumo que foi substituído (não tem)
            conteudo += '\n';
        }

        const caminhoSped = 'public/sped/';
        const caminhoCompleto = `${appRoot}/public/sped/`;
        const now = new Date().getTime();

        if (!fs.existsSync(caminhoCompleto)){
            await mkdirp(caminhoCompleto)
        }

        fs.writeFileSync(`${caminhoSped}/${nomeArquivo}.${'txt'}`, conteudo);

        return `${caminhoSped}${nomeArquivo}.txt`
    }
};

const descUni = async function( unidade, tabelaUnidades ) {
    let descriUnidade = '';
    let unidadeLaco;

    for(let i in tabelaUnidades) {
        unidadeLaco = tabelaUnidades[i];
        if(unidadeLaco[0].trim() == unidade.trim()) {
            descriUnidade = unidadeLaco[1];
            break;
        }
    }

    return descriUnidade || unidade;
};

const tipoProduto = async function( grupo ) {

    let tipoRetorno  = ''

    switch(grupo) {
        case 1: tipoRetorno = '04'; // Produto acabado
        break;
        case 3: tipoRetorno = '01'; // Matéria prima
        break;
        case 5: tipoRetorno = '06'; // Produto intermediário
        break;
        case 6: tipoRetorno = '02'; // Embalagens
        break;
        case 9: tipoRetorno = '01'; // Matéria Prima - de outros
        break;
        case 10: tipoRetorno = '07'; // Material de uso e consumo
        break;
        case 15: tipoRetorno = '01'; // Matéria prima - da unidade 3 Biomart
        break;
        default: tipoRetorno = '01';
    }

    return tipoRetorno;
};


const obterDadosProdutos = function(db, params) {
    return new Promise(async (resolve, reject) => {
        
        const {empresa, mes, ano} = params;

        const inicio = moment(`${ano}.${mes}.01`).format('YYYY-MM-DD');
        const final  = moment(inicio).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD');

        // 04 = Produto acabado / 02 = Embalagem / 01 = Matéria-prima
		let sql = `select PRODUTOS_ID, NCMS_NCM, NCMS_CEST, PRODUTOS_NOME,
                          trim(PRODUTOS_REFERENCIA) as PRODUTOS_REFERENCIA, PRODUTOS_ID_GRUPOS,
                          trim(PRODUTOS_UNIDADE) as PRODUTOS_UNIDADE, SALDOS_CSTLOCAL, SALDOS_ICMSLC
                   from PRODUTOS
                    join PRODUCOES on PRODUCOES_ID_PRODUTOS = PRODUTOS_ID
                    join NCMS on NCMS_ID = PRODUTOS_ID_NCMS
                    join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                    where PRODUCOES_FINALIZADA between '${inicio}' and '${final}'
                    group by PRODUTOS_ID, NCMS_NCM, NCMS_CEST, PRODUTOS_NOME,
                    PRODUTOS_REFERENCIA, PRODUTOS_ID_GRUPOS, PRODUTOS_UNIDADE, SALDOS_CSTLOCAL, SALDOS_ICMSLC
                    
                    union
                    
                    select PRODUTOS_ID, NCMS_NCM, NCMS_CEST, PRODUTOS_NOME,
                            trim(PRODUTOS_REFERENCIA) as PRODUTOS_REFERENCIA, PRODUTOS_ID_GRUPOS,
                            trim(PRODUTOS_UNIDADE) as PRODUTOS_UNIDADE, SALDOS_CSTLOCAL, SALDOS_ICMSLC
                    from PRODUTOS
                    join PRODUCOESITENS on PRODUCOESITENS_ID_PRODUTOS = PRODUTOS_ID
                    join PRODUCOES on PRODUCOES_ID = PRODUCOESITENS_ID_PRODUCOES
                    join NCMS on NCMS_ID = PRODUTOS_ID_NCMS
                    join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                    where PRODUCOES_FINALIZADA between '${inicio}' and '${final}'
                    group by PRODUTOS_ID, NCMS_NCM, NCMS_CEST, PRODUTOS_NOME,
                    PRODUTOS_REFERENCIA, PRODUTOS_ID_GRUPOS, PRODUTOS_UNIDADE, SALDOS_CSTLOCAL, SALDOS_ICMSLC`;

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

const obterDadosItensProduzidos = function(db, params) {
    return new Promise(async (resolve, reject) => {
        
        const {empresa, mes, ano} = params;

        const inicio = moment(`${ano}.${mes}.01`).format('YYYY-MM-DD');
        const final  = moment(inicio).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD');

        
		let sql = `select PRODUCOES_ID_EMPRESAS,
                          PRODUCOES_NUMERO,
                          PRODUCOES_ID_PRODUTOS,
                          PRODUCOES_INICIO,
                          PRODUCOES_FINALIZADA,
                          PRODUCOES_QUANTIDADE,
                          PRODUTOS_EMBALAGEM
                   from PRODUCOES
                    join PRODUTOS on PRODUTOS_ID = PRODUCOES_ID_PRODUTOS
                    where PRODUCOES_ID_EMPRESAS = ${empresa} and
                    PRODUCOES_FINALIZADA between '${inicio}' and '${final}'`;

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

const obterDadosItensConsumidos = function(db, params) {
    return new Promise(async (resolve, reject) => {
        
        const {empresa, mes, ano} = params;

        const inicio = moment(`${ano}.${mes}.01`).format('YYYY-MM-DD');
        const final  = moment(inicio).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD');

        
		let sql = `select PRODUCOESITENS.*,
                          PRODUCOES_ID_EMPRESAS,
                          PRODUCOES_FINALIZADA, 
                          PRODUTOS_EMBALAGEM                         
                   from PRODUCOESITENS
                    join PRODUCOES on PRODUCOES_ID = PRODUCOESITENS_ID_PRODUCOES
                    join PRODUTOS  on PRODUTOS_ID = PRODUCOESITENS_ID_PRODUTOS
                    where PRODUCOES_ID_EMPRESAS = ${empresa} and
                    PRODUCOES_FINALIZADA between '${inicio}' and '${final}'`;

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};