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
        const nomeArquivo = 'INV_' + strZero(params.mes, 2) + params.ano.toString() + '_' + (params.client || 'teste');
        let conteudo = '';
        let contadorBlocoZero = 0;
        let contadorBlocoK = 0;
        let contador0190 = 0;
        let contador0200 = 0;
        let contadorK200 = 0;
        let contadorK230 = 0;
        let contadorK235 = 0;

        let dadosEmpresa  = await obterDadosEmpresa(db, params);  // Empresa
        let dadosProduto  = await obterDadosProdutos(db, params); // Registros 0200 / K200 - Cadastro de produtos
        let dadosUnidades = await obterDadosUnidades(dadosProduto); // Registros 0190 - Unidades produtos
        const dataSld = moment(`${params.ano}-${params.mes}-01`).add(1, 'month').subtract(1, 'day').format('DDMMYYYY');
        const dataIni = '01'+ strZero(params.mes, 2) + params.ano.toString();
        const dataFin = dataSld;

        // Registro 0000
        conteudo += "|0000|015|0|" + dataIni  + "|" + dataFin + "|"
        conteudo += dadosEmpresa['EMPRESAS_NOME']    + "|";
        conteudo += dadosEmpresa['EMPRESAS_CPFCNPJ'] + "||";
        conteudo += dadosEmpresa['CIDADES_ESTADO'] + "|";
        conteudo += utils.string.onlyNumbers(dadosEmpresa['EMPRESAS_INSCRICAO']) + "|";
        conteudo += dadosEmpresa['CIDADES_IBGE'].trim() + "|||A|0|\n";

        // Registro 0001
        conteudo += "|0001|0|\n";

        // Registro 0005
        conteudo += "|0005|";
        conteudo += dadosEmpresa['EMPRESAS_FANTASIA'] + "|";
        conteudo += dadosEmpresa['EMPRESAS_CEP']      + "|";
        conteudo += dadosEmpresa['EMPRESAS_ENDERECO'] + "|";        
        conteudo += dadosEmpresa['EMPRESAS_NUMERO']   + "||"; // Número e complemento
        conteudo += dadosEmpresa['EMPRESAS_BAIRRO']   + "|";
        conteudo += dadosEmpresa['EMPRESAS_TELEFONE'] + "||"; // Fone e fax
        conteudo += dadosEmpresa['EMPRESAS_EMAIL']    + "|\n";

        // Registro 0100 - Dados do contabilista
        conteudo += "|0100|";
        conteudo += "JOAO CARLOS DOS SANTOS SILVA|";
        conteudo += "26273324816|";
        conteudo += "012345678-19/SP|"; // CRC Contabilista
        conteudo += "01291979000167|"; // CNPJ Escritório CTB
        conteudo += "19023380|"; // CEP Contabilista
        conteudo += "RUA VEREADOR HUGO COSTA|";
        conteudo += "220||"; // Numero e complemento
        conteudo += "JARDIM SANTA RITA|";
        conteudo += "18996375310||"; // Fone e fax
        conteudo += "joaocarlos@samos.com.br|";
        conteudo += "3541406|\n";

        contadorBlocoZero += 4;
        // Registro 0190 - Unidades de produto

        for(let i in dadosUnidades) {
            let uniPro  = await descUni(dadosUnidades[i], params.unidades);
            conteudo += "|";
            conteudo += "0190";
            conteudo += "|";
            conteudo += dadosUnidades[i];
            conteudo += "|";
            conteudo += uniPro;
            conteudo += "|\n";
            contadorBlocoZero++;
            contador0190++;
        }
    
        for(let i in dadosProduto) { // Registro 0200

            let model    = dadosProduto[i];
            let codPro  = strZero(model['PRODUTOS_ID'], 60);
            let uniPro  = model['PRODUTOS_UNIDADE'];
            let tipoPro = await tipoProduto(model['PRODUTOS_ID_GRUPOS']); // Se é matéria-prima, produto pra revenda, etc.
            let nomePro = model['PRODUTOS_NOME'].trim();

            conteudo += "|";
            conteudo += "0200";                                         // 004 FIXO 0200
            conteudo += "|";
            conteudo += codPro;                                         // 060 Código do Produto
            conteudo += "|";
            conteudo += nomePro;                                        //  -- Nome do produto
            conteudo += "|";
            conteudo += "";                                             // Código de barras (não tem)
            conteudo += "|";            
            conteudo += "";                                             // Código ant item (não tem)
            conteudo += "|"; 
            conteudo += uniPro;                                         // Unidade do produto 
            conteudo += "|"; 
            conteudo += tipoPro;                                        // Tipo de produto    
            conteudo += "|"; 
            conteudo += model['NCMS_NCM'];                              // NCM Produto
            conteudo += "|"; 
            conteudo += "";                                             // EX_IPI
            conteudo += "|";            
            conteudo += "00";                                           // Código do gênero (tabela 4.2.1)
            conteudo += "|";            
            conteudo += "0000";                                         // Código LST (não tem)
            conteudo += "|";            
            conteudo += "000000";                                       // Alíq ICMS
            conteudo += "|\n";  
            
            contadorBlocoZero++;
            contador0200++;
        }

        // Registo 0990 - Contagem do bloco zero
        contadorBlocoZero++;
        conteudo += "|0990|";
        conteudo += contadorBlocoZero.toString();
        conteudo += "|\n";


        // Registo C001 - Sem dados
        conteudo += "|C001|1";
        conteudo += "|\n";

        // Registo C990 - Totalizador bloco C
        conteudo += "|C990|2";
        conteudo += "|\n";

        // Registo D001 - Sem dados
        conteudo += "|D001|1";
        conteudo += "|\n";

        // Registo D990 - Totalizador
        conteudo += "|D990|2";
        conteudo += "|\n";

        // Registo E001 - Sem dados
        conteudo += "|E001|1";
        conteudo += "|\n";

        // Registo E990 - Totalizador
        conteudo += "|E990|2";
        conteudo += "|\n";

        // Registo G001 - Sem dados
        conteudo += "|G001|1";
        conteudo += "|\n";

        // Registo G990 - Totalizador
        conteudo += "|G990|2";
        conteudo += "|\n";

        // Registo H001 - Sem dados
        conteudo += "|H001|1";
        conteudo += "|\n";

        // Registo H990 - Totalizador
        conteudo += "|H990|2";
        conteudo += "|\n";

        // Registo K001 - Abertura bloco K
        conteudo += "|K001|0";
        conteudo += "|\n";

        contadorBlocoK++;

        // Registo K010 - Layout 0 - simplificado
        conteudo += "|K010|0";
        conteudo += "|\n";

        contadorBlocoK++;

        // Registo K100 - Periodo de apuração
        conteudo += "|K100|";
        conteudo += dataIni;
        conteudo += "|";
        conteudo += dataFin;
        conteudo += "|\n";     

        contadorBlocoK++;

        for(let i in dadosProduto) { // Registro K200

            let model    = dadosProduto[i];
            let codPro  = strZero(model['PRODUTOS_ID'], 60);
            let saldoProduto = await obterSaldoProduto(db, model['PRODUTOS_ID'], params);
                                                                        // TAM
            conteudo += "|";
            conteudo += "K200";                                         // 004 FIXO K200
            conteudo += "|";
            conteudo += dataSld;                                        // 008 Data estoque final
            conteudo += "|";
            conteudo += codPro;                                         // 009 Código do Produto
            conteudo += "|";
            conteudo += ("00000000000000000" + (saldoProduto > 0 ? saldoProduto : 0).toString()).slice(-17); // 017 Saldo do Produto
            conteudo += "|";
            conteudo += "0||\n"                                          // 001 Indicador de estoque e código do participante

            contadorK200++;
            contadorBlocoK++;
        }
      
        let dadosItensProduzidos = await obterDadosItensProduzidos(db, params);

        for(let i in dadosItensProduzidos) {

            let model = dadosItensProduzidos[i];
            let qtdeProduzida = grams((grams(model['PRODUCOES_QUANTIDADE']) / grams(model['PRODUTOS_EMBALAGEM']))) // com 3 decimais
            let dtpIni = moment(model['PRODUCOES_INICIO']).format('DDMMYYYY');
            let dtpFin = moment(model['PRODUCOES_FINALIZADA']).format('DDMMYYYY');

            conteudo += "|";
            conteudo += "K230";                                         // 004 Fixo 'K230'
            conteudo += "|";
            conteudo += dtpIni;                                         // 008 Data inicio produção
            conteudo += "|";
            conteudo += dtpFin;                                         // 008 Data final produção
            conteudo += "|";
            conteudo += strZero(model['PRODUCOES_NUMERO'], 30);         // 030 Código da ordem de produção
            conteudo += "|";
            conteudo += strZero(model['PRODUCOES_ID_PRODUTOS'], 60);    // 060 Código do item produzido
            conteudo += "|";
            conteudo += strZero(qtdeProduzida, 17);                     // 144 159 016 Quantidade produção acabada (3 decimais)
            conteudo += "|";
            conteudo += '\n';

            contadorK230++;
            contadorBlocoK++;
        }

        let dadosItensConsumidos = await obterDadosItensConsumidos(db, params);

        for(let i in dadosItensConsumidos) {

            let model = dadosItensConsumidos[i];
            let qtdeConsumida = grams((grams(model['PRODUCOESITENS_QUANTIDADE']) / grams(model['PRODUTOS_EMBALAGEM']))) // com 3 decimais
            let dtsIni = moment(model['PRODUCOES_INICIO']).format('DDMMYYYY');

            conteudo += "|";
            conteudo += "K235";                                           // 004 Fixo 'K235'
            conteudo += "|";
            conteudo += dtsIni;                                           // 008 Data da saída do estoque
            conteudo += "|";            
            conteudo += strZero(model['PRODUCOESITENS_ID_PRODUTOS'], 60); // 060 Código do item (Produto consumido)
            conteudo += "|";
            conteudo += strZero(qtdeConsumida, 17);                       // 017 Quantidade consumida do item (3 decimais)
            conteudo += '||';                                             // Em branco - código insumo substituido (não tem)
            conteudo += '\n';

            contadorK235++;
            contadorBlocoK++;            
        }

        // Registro K990
        contadorBlocoK++;
        conteudo += "|K990|";
        conteudo += contadorBlocoK.toString();
        conteudo += "|\n";

        // Registro 1001
        conteudo += "|1001|1";
        conteudo += "|\n";

        // Registro 1990
        conteudo += "|1990|2";  
        conteudo += "|\n";

        // Registro 9001
        conteudo += "|9001|0"; 
        conteudo += "|\n";

        // Registro 9900 - Totalizadores
        conteudo += "|9900|0000|1|\n|9900|0001|1|\n|9900|0005|1|\n|9900|0100|1|\n"
        conteudo += "|9900|0190|" + contador0190.toString() + "|\n";
        conteudo += "|9900|0200|" + contador0200.toString() + "|\n";
        conteudo += "|9900|0990|1|\n";
        conteudo += "|9900|C001|1|\n";
        conteudo += "|9900|C990|1|\n";
        conteudo += "|9900|D001|1|\n";
        conteudo += "|9900|D990|1|\n";
        conteudo += "|9900|E001|1|\n";
        conteudo += "|9900|E990|1|\n";
        conteudo += "|9900|G001|1|\n";
        conteudo += "|9900|G990|1|\n";
        conteudo += "|9900|H001|1|\n";
        conteudo += "|9900|H990|1|\n";
        conteudo += "|9900|K001|1|\n";
        conteudo += "|9900|K010|1|\n";
        conteudo += "|9900|K100|1|\n";
        conteudo += "|9900|K200|" + contadorK200.toString() + "|\n";
        conteudo += "|9900|K230|" + contadorK230.toString() + "|\n";
        conteudo += "|9900|K235|" + contadorK235.toString() + "|\n";
        conteudo += "|9900|K990|1|\n";                
        conteudo += "|9900|1001|1|\n";
        conteudo += "|9900|1990|1|\n";
        conteudo += "|9900|9001|1|\n";
        conteudo += "|9900|9900|27|\n";
        conteudo += "|9900|9990|1|\n";
        conteudo += "|9900|9999|1|\n";
        conteudo += "|9990|30|\n";
        conteudo += "|9999|" + (contador0190 + contador0200 + contadorK200 + contadorK230 + contadorK235 + 56).toString() + "|\n";
        
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

const obterDadosEmpresa = function(db, params) {
    return new Promise(async (resolve, reject) => {
        
        const {empresa} = params;

		let sql = `select EMPRESAS_ID, 
                          EMPRESAS_NOME, 
                          EMPRESAS_FANTASIA,
                          EMPRESAS_CPFCNPJ,
                          EMPRESAS_ENDERECO,
                          EMPRESAS_NUMERO,
                          EMPRESAS_BAIRRO,
                          EMPRESAS_CEP,
                          EMPRESAS_TELEFONE,
                          EMPRESAS_EMAIL,
                          CIDADES_IBGE,
                          CIDADES_ESTADO
                   from EMPRESAS
                    join CIDADES on CIDADES_ID = EMPRESAS_ID_CIDADES
                    where EMPRESAS_ID = ${empresa}`;

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0]);
            }
        });
    });
};

const obterDadosProdutos = function(db, params) {
    return new Promise(async (resolve, reject) => {
        
        const {empresa, mes, ano} = params;

        const inicio = moment(`${ano}.${mes}.01`).format('YYYY-MM-DD');
        const final  = moment(inicio).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD');

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

const obterDadosUnidades = async function(produtos) {
    
    let unidadesUnicas = [];

    for(let i in produtos) {
        const findUnidade = produtos[i]['PRODUTOS_UNIDADE'];
        if(unidadesUnicas.indexOf(findUnidade) == -1) {
            unidadesUnicas.push(findUnidade);
        }
    }

    return unidadesUnicas;
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

const obterSaldoProduto = function(db, produto, params) {
    return new Promise(async (resolve, reject) => {
        
        const {empresa, mes, ano} = params;

        const inicio = moment(`${ano}.${mes}.01`).format('YYYY-MM-DD');
        const final  = moment(inicio).add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD');

        
		let sql = `select MOVIMENTOSITENS_ID_PRODUTOS,
                          sum(case when OPERACOES_ESTOQUE = 'C' and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
                              then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_ENTRADAS,
                          sum(case when OPERACOES_ESTOQUE = 'D' and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
                              then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_SAIDAS
                   from MOVIMENTOSITENS
                   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                   join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                    where MOVIMENTOS_ID_EMPRESAS = ${empresa} and
                          MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
                          MOVIMENTOS_ENTRADASAIDA <= '${final}'
                   group by MOVIMENTOSITENS_ID_PRODUTOS`;

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                const saldo = (grams(results[0]['MOVIMENTOSITENS_ENTRADAS']) - grams(results[0]['MOVIMENTOSITENS_SAIDAS']));
                resolve(saldo);
            }
        });
    });
};