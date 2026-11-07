'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');
const xmlJS   = require('xml-js');
const api     = require('../../../modules');
const cents   = utils.number.cents.bind(utils.number);

module.exports = {
    create: async (data, params) => {
        try {
            const { xml } = data;

            const queryEmpresa = await samosFB.executeSQL(`
                select 
                    EMPRESAS_ID,
                    EMPRESAS_CPFCNPJ,
                    CIDADES_ID,
                    CIDADES_ESTADO
                from EMPRESAS 
                join CIDADES on CIDADES_ID = EMPRESAS_ID_CIDADES
                where EMPRESAS_ID = ${params.empresaLogada}
            `, params);

            const empresa = queryEmpresa[0];
            let layoutXML = '';

            if((params.client || 'PRUDENART').toUpperCase() == 'PRUDENART') { // PrudenArt usa niveis a mais do XML
                layoutXML = 'A'
            } else {
                layoutXML = 'B'
            }    

            if (xml) {

                const jsonLido = JSON.parse(xmlJS.xml2json(xml, { compact: true }));

                let jsonXML;

                if(layoutXML == 'A') {
                    jsonXML = { CompNfse : jsonLido.ConsultarNfseFaixaResposta.ListaNfse.CompNfse };
                } else {
                    jsonXML = { CompNfse : jsonLido.CompNfse };
                }

                require('fs').writeFileSync('xml.xml', xml);
                require('fs').writeFileSync('xml.json', JSON.stringify(jsonXML, null, 4));


                if(!jsonXML.CompNfse) {
                    throw `Não é XML de Nota de Serviços. Tipo: ${Object.keys(jsonXML)[0] || '""'}`;
                }    
                
                const cnpjPrestador = (jsonXML.CompNfse.Nfse.InfNfse.PrestadorServico.IdentificacaoPrestador.CpfCnpj.Cnpj._text || '')

                if(cnpjPrestador.trim() == empresa['EMPRESAS_CPFCNPJ'].trim()) {
                    const processoImportacao = await importaNfs(jsonXML,empresa, params);

                    if (processoImportacao.success) {
                        return  {
                            status : 'Nota importada com sucesso',
                            caminho: processoImportacao.caminho,
                            retorno: processoImportacao.retorno
                        };
                    } else {
                        return {
                            status : 'Nota de serviço já importada - verifique',
                            caminho: processoImportacao.caminho,
                            retorno: processoImportacao.retorno
                        };
                    }

                } else {
                    return  {
                        status : 'Não consegui importar a NFS-e - verifique se o CNPJ é correspondente',
                        caminho: '0',
                        retorno: '0'
                    };
                }

            } else {
                console.log('Dados de XML vazio: ' + xml);

                return {
                    status : 'Dados de XML vazio',
                    caminho: '0',
                    retorno: '0'
                };
            }

        } catch(error) {
            const msg = 'Falha importar XML Nota Entrada';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function importaNfs(jsonXML, empresa, params) {
    
    const queryOrdem = await samosFB.executeSQL(`
        select ORDENS_ID from ORDENS where 
            ORDENS_ID_EMPRESAS   = '${empresa['EMPRESAS_ID']}'                     and
            ORDENS_ID_DOCUMENTOS = '${empresa['EMPRESAS_ID']}0016'                 and
            ORDENS_NUMERO        = '${jsonXML.CompNfse.Nfse.InfNfse.Numero._text}' and
            ORDENS_SERIE         = 'NS'
        `, params);

    if(queryOrdem[0]) {
        const ordem = queryOrdem[0];

        console.log(`xml ja importado: ${jsonXML.CompNfse.Nfse.InfNfse.Numero._text}`);

        return {
            success: false,
            caminho: ordem['ORDENS_ID'],
            retorno: ''
        };
    }

    let layoutXML;

    if((params.client || 'PRUDENART').toUpperCase() == 'PRUDENART') { // Layout Personalizdo PrudenArt
        layoutXML = 'A'
    } else {
        layoutXML = 'B'
    }    


    const cnpTomador = jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Tomador?.IdentificacaoTomador?.CpfCnpj?.Cnpj ?
                       jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Tomador?.IdentificacaoTomador?.CpfCnpj?.Cnpj?._text :
                       jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Tomador?.IdentificacaoTomador?.CpfCnpj?.Cpf?._text;
    
    const queryPessoa = await samosFB.executeSQL(`
        select 
            PESSOAS_ID,
            PESSOAS_ID_USUARIOS,
            PESSOAS_EMAIL,
            PESSOAS_NOME,
            PESSOAS_CREDITO,
            PESSOAS_CPFCNPJ
        from PESSOAS where 
            PESSOAS_CPFCNPJ = '${cnpTomador}' 
        order by PESSOAS_ID
    `, params);

    const pessoa = queryPessoa[0] || await incluiPessoa(jsonXML, empresa, params);
    const operacao = layoutXML == 'A' ? 593300 : 535300;
    const idCidadeTomador = await achaCidades(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Tomador?.Endereco?.Cep?._text);

    const idCidadeIncidencia = ((jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.CodigoMunicipio?._text || '').toString() == (idCidadeTomador || '').toString()) ?
                               idCidadeTomador : empresa['CIDADES_ID'];

    const valorInss = cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.ValorInss?._text);
    const valorBaseInss = cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.ValoresNfse?.BaseCalculo?._text);
    const perbaseInss = cents(pessoa['PESSOAS_CREDITO'])
    const aliqInss = perbaseInss > 0 ? (valorInss / (valorBaseInss * (perbaseInss / 1000000))) : 0;

    const ordem = {
        'ORDENS_ID_EMPRESAS'     : empresa['EMPRESAS_ID'],
        'ORDENS_ID_PESSOAS'      : pessoa['PESSOAS_ID'],
        'ORDENS_ID_USUARIOS'     : (params.userId || 1),
        'ORDENS_ID_OPERACOES'    : operacao,
        'ORDENS_ID_PRAZOS'       : 11, // Fixo 14 DDL
        'ORDENS_ID_DOCUMENTOS'   : `${empresa['EMPRESAS_ID']}0016`,
        'ORDENS_NUMERO'          : jsonXML?.CompNfse?.Nfse?.InfNfse?.Numero?._text,
        'ORDENS_SERIE'           : 'NS',
        'ORDENS_EMISSAO'         : (jsonXML?.CompNfse?.Nfse?.InfNfse?.DataEmissao?._text || '1899-12-30')?.slice(0, 10), 
        'ORDENS_FECHAMENTO'      : (jsonXML?.CompNfse?.Nfse?.InfNfse?.DataEmissao?._text || '1899-12-30')?.slice(0, 10), 
        'ORDENS_HORAFECHAMENTO'  : (jsonXML?.CompNfse?.Nfse?.InfNfse?.DataEmissao?._text || '1899-12-30')?.slice(-8),    
        'ORDENS_PRODUTOS'        : 0,
        'ORDENS_SERVICOS'        : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.ValorServicos?._text)/100),
        'ORDENS_DESCONTOS'       : ((cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.DescontoIncondicionado?._text) +
                                     cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.DescontoIncondicionado?._text))/100),
        'ORDENS_ALIQUOTAISS'     : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.ValoresNfse?.Aliquota?._text)/100),
        'ORDENS_VALORISS'        : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.ValoresNfse?.ValorIss?._text)/100),
        'ORDENS_VALORPIS'        : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.ValorPis?._text)/100),
        'ORDENS_VALORCOFINS'     : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.ValorCofins?._text)/100),
        'ORDENS_VALORDEDUCOES'   : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.ValorDeducoes?._text)/100),        
        'ORDENS_VALORRETENCOES'  : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.OutrasRetencoes?._text)/100),        
        'ORDENS_VALORIRRF'       : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.ValorIr?._text)/100),                
        'ORDENS_ALIQUOTAINSS'    : aliqInss,                        
        'ORDENS_VALORINSS'       : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.ValorInss?._text)/100),
        'ORDENS_TOTAL'           : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.ValoresNfse?.ValorLiquidoNfse?._text)/100),
        'ORDENS_NFE'             : (jsonXML?.CompNfse?.Nfse?.InfNfse?._attributes?.Id || '').slice(0, 50),
        'ORDENS_PROTOCOLO'       : (jsonXML?.CompNfse?.Nfse?.InfNfse?.CodigoVerificacao?._text || '').slice(0, 50),
        'ORDENS_OBSERVACOES'     : '',
        'ORDENS_STATUS'          : 'F',
        'ORDENS_LOG'             : `IMPORTADO NFS-e ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        'ORDENS_EMAIL'           : (pessoa['PESSOAS_EMAIL'] || '').slice(0, 50),
        'ORDENS_NOME'            : (pessoa['PESSOAS_NOME']    || '').slice(0, 50),
        'ORDENS_CPFCNPJ'         : (pessoa['PESSOAS_CPFCNPJ'] || '').slice(0, 15),
        'ORDENS_TRIBUTACAO'      : jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.CodigoCnae?._text,
        'ORDENS_CODIGOSERVICO'   : jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.ItemListaServico?._text,
        'ORDENS_ID_CIDADES'      : idCidadeTomador,
        'ORDENS_IDSKY'           : idCidadeIncidencia,
        'ORDENS_ISSRETIDO'       : (jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.IssRetido?._text == '1' ? 'R' : 'N'),
        'ORDENS_ID_EMPRESAORIGEM': 0,
        'ORDENS_NUMEROORIGEM'    : 0,
        'ORDENS_SERIEORIGEM'     : ''
    }

    ordem['ORDENS_OBSERVACOES'] = '|||||||||';

    try {
        await samosFB.insert('ORDENS', ordem, params);
    } catch (error) {
        console.log(error);
        throw 'Erro ao gravar nota de serviços';
    }

    const item = {
        'ORDENSSERVICOS_ID'           : -1,
        'ORDENSSERVICOS_ID_ORDENS'    : ordem['ORDENS_ID'],
        'ORDENSSERVICOS_ID_USUARIOS'  : (params.userId || 1),
        'ORDENSSERVICOS_ID_SERVICOS'  : 1,
        'ORDENSSERVICOS_DESCRITIVO'   : jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Discriminacao?._text,
        'ORDENSSERVICOS_QUANTIDADE'   : 1,
        'ORDENSSERVICOS_PRECO'        : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.ValorServicos?._text)/100),
        'ORDENSSERVICOS_PERCENTUAL'   : 0,
        'ORDENSSERVICOS_TOTAL'        : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.ValorServicos?._text)/100),
        'ORDENSSERVICOS_DESCONTOS'    : ((cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.DescontoIncondicionado?._text) +
                                          cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Servico?.Valores?.DescontoIncondicionado?._text))/100),
        'ORDENSSERVICOS_ISS'          : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.ValoresNfse?.Aliquota?._text)/100),
        'ORDENSSERVICOS_BASEISS'      : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.ValoresNfse?.BaseCalculo?._text)/100),        
        'ORDENSSERVICOS_VALORISS'     : (cents(jsonXML?.CompNfse?.Nfse?.InfNfse?.ValoresNfse?.ValorIss?._text)/100),
        'ORDENSSERVICOS_IRRF'         : 0,
        'ORDENSSERVICOS_BASEIRRF'     : 0,        
        'ORDENSSERVICOS_VALORIRRF'    : 0
    }

    try {
        await samosFB.insert('ORDENSSERVICOS', item, params);
    } catch (error) {
        console.log(error);
        throw 'Erro ao gravar itens';
    }    

    return {
        success: true,
        caminho: ordem['ORDENS_ID'],
        retorno: ''
    };
}

async function incluiPessoa(jsonXML, empresa, params) {  // Vou ajustar por último, a maioria já tem cadastro


    const cnpjTomador = jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Tomador?.IdentificacaoTomador?.CpfCnpj?.Cnpj ?
                        jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Tomador?.IdentificacaoTomador?.CpfCnpj?.Cnpj?._text :
                        jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Tomador?.IdentificacaoTomador?.CpfCnpj?.Cpf?._text;

    const nomeTomador = jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Tomador?.RazaoSocial?._text || 'RAZAO SOCIAL NÃO INFORMADA';

    console.log('cnpj: ' + cnpjTomador, 'nome: ' + nomeTomador);

    const cidadesId = await achaCidades(jsonXML?.CompNfse?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Tomador?.Endereco?.Cep?._text, params);

    console.log('cidadesId: ' + cidadesId);

    const nomeFantasia = jsonXML.nfeProc.NFe.infNFe.emit.xFant ? 
                         jsonXML.nfeProc.NFe.infNFe.emit.xFant._text : '';
    const pessoa = {
        'PESSOAS_STATUS'            : 'T',
        'PESSOAS_TIPO'              : 'C',
        'PESSOAS_CPFCNPJ'           : jsonXML.nfeProc.NFe.infNFe.emit.CNPJ._text,
        'PESSOAS_INSCRICAO'         : jsonXML.nfeProc.NFe.infNFe.emit.IE._text,
        'PESSOAS_CADASTRO'          : moment().format('YYYY-MM-DD'),
        'PESSOAS_NASCIMENTO'        : moment().format('YYYY-MM-DD'),
        'PESSOAS_VALIDADE'          : moment().add(1, 'year').format('YYYY-MM-DD'),
        'PESSOAS_NOME'              : (jsonXML.nfeProc.NFe.infNFe.emit.xNome._text             || '').slice(0, 50),
        'PESSOAS_FANTASIA'          : nomeFantasia.slice(0, 50),
        'PESSOAS_CEP'               : jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.CEP._text      || '',
        'PESSOAS_ENDERECO'          : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.xLgr._text    || '').slice(0, 50),
        'PESSOAS_NUMERO'            : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.nro._text     || '').slice(0, 10),
        'PESSOAS_BAIRRO'            : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.xBairro._text || '').slice(0, 10),
        'PESSOAS_EMAIL'             : '',
        'PESSOAS_PAGINA'            : '',
        'PESSOAS_ID_CIDADES'        : cidadesId,
        'PESSOAS_ID_PAISES'         : 31,
        'PESSOAS_ID_EMPRESAS'       : empresa['EMPRESAS_ID'],
        'PESSOAS_TELEFONE'          : '',
        'PESSOAS_CELULAR'           : '',
        'PESSOAS_ID_USUARIOS'       : 1,
        'PESSOAS_CEPCOBRANCA'       : jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.CEP._text      || '',
        'PESSOAS_ENDERECOCOBRANCA'  : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.xLgr._text    || '').slice(0, 50),
        'PESSOAS_NUMEROCOBRANCA'    : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.nro._text     || '').slice(0, 10),
        'PESSOAS_BAIRROCOBRANCA'    : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.xBairro._text || '').slice(0, 10),
        'PESSOAS_ID_CIDADESCOBRANCA': cidadesId,
        'PESSOAS_TELEFONECOBRANCA'  : '',
        'PESSOAS_CELULARCOBRANCA'   : '',
        'PESSOAS_CATEGORIA'         : '1',
        'PESSOAS_CREDITO'           : 0,
        'PESSOAS_INCLUSAO'          : `IMPORTADO NFE ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        'PESSOAS_LOG'               : `IMPORTADO NFE ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        'PESSOAS_OBSERVACOES'       : ''
    }

    try {
        await samosFB.insert('PESSOAS', pessoa, params);
        return pessoa;        
    } catch (error) {
        console.log('Erro ao incluir Pessoa');
        console.log(error);
        throw 'Erro ao incluir Pessoa';
    }
}

async function achaCidades(cep){

    console.log("buscando: " + cep);

    try {
        const queryCep = await api['consultas/ceps']().read({
            conteudo: cep,
            ordem: 0
        })
        
        if(queryCep.results[0]) {
            return queryCep.results[0]['CEPS_ID'];
        }
    } catch (error) {
        console.log('Erro ao localizar ID da Cidade');
        console.log(error);
    }

    return 9237;
}

