Ext.define('SamosAdmin.movimentos.notaconsumidor.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOS_ID',

    requires: [
        'SamosFinanceiros.titulos.ModelCaixa'
    ],

    proxy: {
        type: 'nodejsrest',
        url: 'server/notaconsumidor',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOS_ID_EMPRESAORIGEM': 0,
            'MOVIMENTOS_NUMEROORIGEM'    : 0,
            'MOVIMENTOS_SERIEORIGEM'     : '',
            'MOVIMENTOS_ID_EMPRESAS'     : configs.getEmpresa().id,
            'EMPRESAS_AMBIENTE'          : configs.getEmpresa().ambiente,
            'MOVIMENTOS_ID_PROPRIEDADES' : 0,
            'MOVIMENTOS_HORA'            : momentServer().format('HH:mm:ss'),
            'MOVIMENTOS_EMISSAO'         : momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOS_STATUS'          : 'N',
            'MOVIMENTOS_ID_PRAZOS'       : 12,
            'PRAZOS_NOME'                : '30 DDL',
            'MOVIMENTOS_SITUACAO'        : 'T',
            'MOVIMENTOS_LOG'             : SamosUtils.Info.getLog(),
            'MOVIMENTOS_ID_USUARIOS'     : configs.getMovimentos().carregaVendedor ? configs.getUsuario().id   : '',
            'USUARIOS_NOME'              : configs.getMovimentos().carregaVendedor ? configs.getUsuario().nome : '',
            'USUARIOS_LOGIN'             : configs.getUsuario().login,
            'MOVIMENTOS_NFE'             : '',
            'MOVIMENTOS_PROTOCOLO'       : '',
            'MOVIMENTOS_IMPOSTO'         : 0,
            'MOVIMENTOS_DESCONTOS'       : 0,
            'MOVIMENTOS_PERCENTUAL'      : 0,
            'MOVIMENTOS_PRODUTOS'        : 0,
            'MOVIMENTOS_TOTAL'           : 0,
            'MOVIMENTOS_OBSERVACOES'     : '||||||||',
            'MOVIMENTOS_CAIXA'           : [Ext.create('SamosFinanceiros.titulos.ModelCaixa', { 'MOVIMENTOSCAIXA_ID': -1 }).data],
            'MOVIMENTOS_ITENSANTIGOS'    : []
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
            name: 'MOVIMENTOS_ID_PROPRIEDADES',      
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
        {
            name: 'MOVIMENTOS_CELULAR',      
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MOVIMENTOS_EMAIL',
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MOVIMENTOS_EMISSAO',
            type: 'nodejsdate',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_HORA',
            critical: true
        },
        {
            name: 'MOVIMENTOS_ENTRADASAIDA',
            type: 'nodejsdate'
        },
        {
            name: 'MOVIMENTOS_STATUS',
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
        'MOVIMENTOS_LOG',
        {
            name: 'MOVIMENTOS_ID_OPERACOES',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_NFE',
            critical: true,
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MOVIMENTOS_PROTOCOLO',
            critical: true,
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MOVIMENTOS_IMPOSTO',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_DESCONTOS',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_PERCENTUAL',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_PRODUTOS',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_TOTAL',
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOS_ID_EMPRESAORIGEM',
        'MOVIMENTOS_NUMEROORIGEM',
        'MOVIMENTOS_SERIEORIGEM',
        {
            name: 'MOVIMENTOS_OBSERVACOES',
            critical: true,
            validators: [
                {type: 'length', max: 512}
            ]
        },
        {
            name: 'MOVIMENTOS_ITENSANTIGOS',
            critical: true
        },
        {
            name: 'MOVIMENTOS_ITENS',  
            critical: true            
        },

        'MOVIMENTOS_CAIXA',
        'MOVIMENTOS_CARTOES',
        'MOVIMENTOS_CHEQUES',
        {
            name: 'MOVIMENTOS_FINANCEIROS',
            critical: true
        }
    ]
});
