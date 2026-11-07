Ext.define('SamosAdmin.movimentos.encomendas.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/encomendas',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOS_SERIEORIGEM'     : '',
            'MOVIMENTOS_ID_EMPRESAS'     : configs.getEmpresa().id,
            'EMPRESAS_AMBIENTE'          : configs.getEmpresa().ambiente,
            'MOVIMENTOS_HORA'            : momentServer().format('HH:mm:ss'),
            'MOVIMENTOS_EMISSAO'         : momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOS_STATUS'          : 'N',
            'MOVIMENTOS_ID_PRAZOS'       : 12,
            'PRAZOS_NOME'                : '30 DDL',
            'MOVIMENTOS_SITUACAO'        : configs.getMovimentos().entrega.situacao,
            'MOVIMENTOS_LOG'             : SamosUtils.Info.getLog(),
            'MOVIMENTOS_ID_USUARIOS'     : configs.getMovimentos().carregaVendedor ? configs.getUsuario().id   : '',
            'USUARIOS_NOME'              : configs.getMovimentos().carregaVendedor ? configs.getUsuario().nome : '',
            'USUARIOS_LOGIN'             : configs.getUsuario().login,
            'MOVIMENTOS_NFE'             : '',
            'MOVIMENTOS_PROTOCOLO'       : '',
            'MOVIMENTOS_BASEICMS'        : 0,
            'MOVIMENTOS_VALORICMS'       : 0,
            'MOVIMENTOS_BASEST'          : 0,
            'MOVIMENTOS_VALORST'         : 0,
            'MOVIMENTOS_VALORIPI'        : 0,
            'MOVIMENTOS_IMPOSTO'         : 0,
            'MOVIMENTOS_FRETE'           : 0,
            'MOVIMENTOS_DESCONTOS'       : 0,
            'MOVIMENTOS_PERCENTUAL'      : 0,
            'MOVIMENTOS_PRODUTOS'        : 0,
            'MOVIMENTOS_SEGURO'          : 0,
            'MOVIMENTOS_DESPESAS'        : 0,
            'MOVIMENTOS_MARGEM'          : 0,
            'MOVIMENTOS_TOTAL'           : 0,
            'MOVIMENTOS_OBSERVACOES'     : '||||||||||',
            'MOVIMENTOS_CAIXA'           : [],
            'MOVIMENTOS_FORMASPAGAMENTO' : [],
            'MOVIMENTOS_ENVIO'           : []
        };

        this.callParent(arguments);
    },

    fields: [
        'MOVIMENTOS_ID',
        {
            name: 'MOVIMENTOS_NUMERO', 
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },   
        {
            name: 'MOVIMENTOS_SERIE', 
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },   
        {
            name: 'MOVIMENTOS_SITUACAO',     
            critical: true
        },   
        {
            name: 'MOVIMENTOS_ID_DOCUMENTOS',     
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },   
        {
            name: 'DOCUMENTOS_NOME',     
            critical: true
        }, 
        'DOCUMENTOS_ID_PESSOAS', 
        'CONSUMIDOR_CIDADESNOME', 
        'CONSUMIDOR_CIDADESESTADO', 
        'DOCUMENTOS_ALTERAPRECO', 
        'DOCUMENTOS_DESCONTOITEM',  
        'DOCUMENTOS_COLETACARTAO', 
        'DOCUMENTOS_COLETACHEQUE',
        'DOCUMENTOS_COLETATRANSPORTE',
        'DOCUMENTOS_COLETAENTREGA',
        'DOCUMENTOS_COLETAOUTRO',
        'DOCUMENTOS_LAYOUT',
        {
            name: 'MOVIMENTOS_ID_EMPRESAS', 
            critical: true,   
            validators: [
                {type: 'presence'}
            ]
        }, 
        'EMPRESAS_AMBIENTE', 
        {
            name: 'MOVIMENTOS_NOME',      
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MOVIMENTOS_ID_PESSOAS',      
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_CPFCNPJ',
            type: 'mask',
            validators: [
                {type: 'cpfcnpj'}
            ]
        },
        'PESSOAS_ENDERECO',
        'PESSOAS_NUMERO',
        'PESSOAS_BAIRRO',
        'PESSOAS_CEP',
        'PESSOAS_INSCRICAO',
        'PESSOAS_TELEFONE',
        'MOVIMENTOS_CELULAR',
        'PESSOAS_CREDITO',
        'PESSOAS_OBSERVACOES',
        'PESSOAS_ID_CIDADES',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        'CIDADES_IBGE',
        {
            name: 'MOVIMENTOS_EMAIL',
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MOVIMENTOS_EMISSAO',         // DATE
            type: 'nodejsdate',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_HORA',//VARCHAR(10)
            critical: true
        },
        {
            name: 'MOVIMENTOS_ENTRADASAIDA',    // DATE
            type: 'nodejsdate'
        },
        {
            name: 'MOVIMENTOS_STATUS',         // CHAR(1),
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_ID_USUARIOS',   
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'USUARIOS_NOME',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'USUARIOS_LOGIN',
            critical: true
        },
        {
            name: 'MOVIMENTOS_ID_PRAZOS', 
            critical: true,      
            validators: [
                {type: 'presence'}
            ]
        },
        'PRAZOS_NOME',
        'PRAZOS_PARCELAS',
        'PRAZOS_PARCELAMENTO',
        'PRAZOS_EXPORTADO',
        'CHEQUES_ID_BANCOS',
        'CHEQUES_AGENCIA',
        'CHEQUES_CONTA',
        'CHEQUES_NUMERO',
        'CHEQUES_CPFCNPJ',
        'MOVIMENTOS_LOG',
        {
            name: 'MOVIMENTOS_ID_OPERACOES',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        'OPERACOES_NOME',
        'OPERACOES_UNICA',
        'OPERACOES_FINANCEIRO',  
        'OPERACOES_FINALIDADE',
        'OPERACOES_BAIXAVISTA',
        'OPERACOES_ID_APLICACOES', 
        {
            name: 'MOVIMENTOS_NFE',             // VARCHAR(128),
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MOVIMENTOS_PROTOCOLO',       // VARCHAR(15),
            critical: true,
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MOVIMENTOS_BASEICMS',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_VALORICMS',       // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_BASEST',          // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_VALORST',         // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_VALORIPI',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_FRETE',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_IMPOSTO',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_DESCONTOS',       // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_PERCENTUAL',       // NUMERIC(7,3)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_PRODUTOS',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_SEGURO',          // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_DESPESAS',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOS_MARGEM',          // NUMERIC(7,3)
        {
            name: 'MOVIMENTOS_TOTAL',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOS_ID_EMPRESAORIGEM',
        'MOVIMENTOS_NUMEROORIGEM',
        'MOVIMENTOS_SERIEORIGEM',
        {
            name: 'MOVIMENTOS_OBSERVACOES',    // VARCHAR(512),
            validators: [
                {type: 'length', max: 512}
            ]
        },
        'MOVIMENTOS_ITENS',                     // lista de ModelItens
        'MOVIMENTOS_ENVIO',                     // lista de Envios
        'MOVIMENTOS_CARTAS',                    // lista de Cartas de Correção
        'MOVIMENTOS_CAIXA',                     // lista de Caixa
        'MOVIMENTOS_FORMASPAGAMENTO',           // lista de Formas de Pagamentos (ORC)
        'MOVIMENTOS_CARTOES',                   // lista de Cartoes
        'MOVIMENTOS_CHEQUES',                   // lista de Cheques
        'MOVIMENTOS_FINANCEIROS',               // lista de Financeiros
        'MOVIMENTOS_ROMANEIOS'                  // lista de romaneios
    ]
});
