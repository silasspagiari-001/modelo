Ext.define('SamosAdmin.movimentos.notaservicos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENS_ID',

    requires: [
        'SamosFinanceiros.titulos.ModelCaixa'
    ],

    proxy: {
        type: 'nodejsrest',
        url: 'server/notaservicos',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENS_ID_EMPRESAORIGEM': 0,
            'ORDENS_NUMEROORIGEM'    : 0,
            'ORDENS_ID_PESSOAS'       : 0,
            'ORDENS_SERIEORIGEM'      : '',
            'ORDENS_ID_EMPRESAS'      : configs.getEmpresa().id,
            'EMPRESAS_AMBIENTE'       : configs.getEmpresa().ambiente,
            'ORDENS_EMISSAO'          : momentServer().format('YYYY-MM-DD'),
            'ORDENS_STATUS'           : 'N',
            'ORDENS_ID_PRAZOS'        : 11,
            'PRAZOS_NOME'             : '14 DDL',
            'ORDENS_LOG'              : SamosUtils.Info.getLog(),
            'ORDENS_ID_USUARIOS'      : configs.getMovimentos().carregaVendedor ? configs.getUsuario().id   : '',
            'USUARIOS_NOME'           : configs.getMovimentos().carregaVendedor ? configs.getUsuario().nome : '',
            'USUARIOS_LOGIN'          : configs.getUsuario().login,
            'ORDENS_NFE'              : '',
            'ORDENS_PROTOCOLO'        : '',
            'ORDENS_TRIBUTACAO'       : configs.getMovimentos().cnaeServicosPadrao,
            'ORDENS_CODIGOSERVICO'    : configs.getMovimentos().tabelaServicosPadrao,  
            'ORDENS_ID_CIDADES'       : 9416,
            'CIDADES_NOMEPRESTACAO'   : 'PRESIDENTE PRUDENTE',
            'CIDADES_ESTADOPRESTACAO' : 'SP',
            'ORDENS_IDSKY'            : 9416,
            'CIDADES_NOMEINCIDENCIA'  : 'PRESIDENTE PRUDENTE',
            'CIDADES_ESTADOINCIDENCIA': 'SP',
            'ORDENS_DESCONTOS'       : 0,
            'ORDENS_PRODUTOS'        : 0,
            'ORDENS_SERVICOS'        : 0,
            'ORDENS_TOTAL'           : 0,
            'ORDENS_ISSRETIDO'       : configs.getMovimentos().retemISS ? 'R' : 'N',
            'ORDENS_ALIQUOTAISS'     : configs.getMovimentos().aliquotaISS,
            'ORDENS_ALIQUOTAINSS'    : configs.getMovimentos().aliquotaINSS,
            'ORDENS_OBSERVACOES'     : '||||||||',
            'ORDENS_CAIXA'           : [Ext.create('SamosFinanceiros.titulos.ModelCaixa', { 'MOVIMENTOSCAIXA_ID': -1 }).data]
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENS_ID',
        {
            name: 'ORDENS_NUMERO', 
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },   
        {
            name: 'ORDENS_SERIE', 
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },   
        {
            name: 'ORDENS_ID_DOCUMENTOS',     
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
            name: 'ORDENS_ID_EMPRESAS', 
            critical: true,   
            validators: [
                {type: 'presence'}
            ]
        }, 
        'EMPRESAS_ID_CIDADES',        
        'CIDADES_NOMEEMPRESA',
        'CIDADES_ESTADOEMPRESA',
        'CIDADES_NOMEPRESTACAO',
        'CIDADES_ESTADOPRESTACAO',
        'CIDADES_NOMEINCIDENCIA',
        'CIDADES_ESTADOINCIDENCIA',
        'EMPRESAS_AMBIENTE', 
        {
            name: 'ORDENS_NOME',      
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'ORDENS_ID_PESSOAS',      
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_CPFCNPJ',
            type: 'mask',
            validators: [
                {type: 'cpfcnpj'}
            ]
        },
        {
            name: 'ORDENS_CELULAR',      
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'ORDENS_EMAIL',
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'ORDENS_EMISSAO',
            type: 'nodejsdate',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_HORAEMISSAO',//VARCHAR(10)
            critical: true
        },
        {
            name: 'ORDENS_STATUS',         // CHAR(1),
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_ID_USUARIOS',   
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
            name: 'ORDENS_ID_PRAZOS', 
            critical: true,      
            validators: [
                {type: 'presence'}
            ]
        },
        'PESSOAS_CREDITO',  // Base INSS
        'PESSOAS_PAGINA',   // CNO
        'PRAZOS_NOME',
        'PRAZOS_PARCELAS',
        'PRAZOS_PARCELAMENTO',
        'PRAZOS_EXPORTADO',
        'ORDENS_LOG',
        {
            name: 'ORDENS_ID_OPERACOES',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_NFE',             // VARCHAR(128),
            critical: true,
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'ORDENS_PROTOCOLO',       // VARCHAR(15),
            critical: true,
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'ORDENS_DESCONTOS',       // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_PRODUTOS',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_SERVICOS',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_TOTAL',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENS_ID_CIDADES', // Cidade prestação serviço
        'ORDENS_IDSKY',      // Cidade incidencia ISS
        'ORDENS_ID_EMPRESAORIGEM',
        'ORDENS_NUMEROORIGEM',
        'ORDENS_SERIEORIGEM',
        'ORDENS_ALIQUOTAISS',
        'ORDENS_ALIQUOTAINSS',
        'ORDENS_ALIQUOTAIRRF',
        'ORDENS_VALORISS',
        'ORDENS_VALORINSS',
        'ORDENS_VALORIRRF',
        'ORDENS_ISSRETIDO',
        'ORDENS_VALORDEDUCOES',
        'ORDENS_VALORRETENCOES',
        {
            name: 'ORDENS_OBSERVACOES',    // VARCHAR(512),
            critical: true,
            validators: [
                {type: 'length', max: 512}
            ]
        },
        'ORDENS_PRODUTOSITENS',
        'ORDENS_SERVICOSITENS',
        'ORDENS_CAIXA',                     // lista de Caixa
        'ORDENS_CARTOES',                   // lista de Cartoes
        'ORDENS_CHEQUES',                   // lista de Cheques
        {
            name: 'ORDENS_FINANCEIROS',
            critical: true
        }
    ]
});
