Ext.define('SamosAdmin.atualizacao.documentos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'DOCUMENTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/documentos'
    },

    constructor: function () {
        this.defaultValues = {
            'DOCUMENTOS_ID_EMPRESAS': configs.getEmpresa().id
        };
        this.callParent(arguments);
    },

    fields: [
        'DOCUMENTOS_ID', //INTEGER NOT NULL
        {
            name: 'DOCUMENTOS_STATUS', //  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: "DOCUMENTOS_NOME", //VARCHAR(50)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        'DOCUMENTOS_ID_EMPRESAS', //INTEGER NOT NULL
        {
            name: 'DOCUMENTOS_ULTIMO', //INTEGER NOT NULL
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'DOCUMENTOS_ID_OPERACOES', //INTEGER NOT NULL
            validators: [
                {type: 'presence'}
            ]
        },
        'OPERACOES_NOME',
        'OPERACOES_BAIXAVISTA',
        'OPERACOES_ESTOQUE',
        'OPERACOES_FINANCEIRO',
        'OPERACOES_COMPLEMENTAR',
        'OPERACOES_ID_PRAZOS',
        'OPERACOES_ST',
        'OPERACOES_PISCOFINS',
        {
            name: "DOCUMENTOS_SERIE", //VARCHAR(3)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 3}
            ]
        },
        'DOCUMENTOS_ID_APLICACOES',
        'APLICACOES_NOME',
        'DOCUMENTOS_ID_PESSOAS', //INTEGER
        'PESSOAS_NOME',
        'PESSOAS_FANTASIA',
        'PESSOAS_TIPO',
        'PESSOAS_ID_CIDADES',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        'EMPRESAS_CNAE',
        'EMPRESAS_SIMPLES',
        'EMPRESAS_ID_CIDADES',
        'EMPRESAS_REGIAO12',
        {
            name: 'DOCUMENTOS_ALTERAPRECO', //  CHAR(1)
            type: 'check',
            defaultValue: 'F'
        },
        {
            name: 'DOCUMENTOS_DESCONTOITEM', //  CHAR(1)
            defaultValue: 'F'
        },
        {
            name: 'DOCUMENTOS_COLETACARTAO', //  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'DOCUMENTOS_COLETACHEQUE', //  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'DOCUMENTOS_COLETATRANSPORTE',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'DOCUMENTOS_COLETAENTREGA',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'DOCUMENTOS_COLETAOUTRO',
            type: 'check',
            defaultValue: 'T'
        },
        'DOCUMENTOS_LAYOUT'
    ]
})
