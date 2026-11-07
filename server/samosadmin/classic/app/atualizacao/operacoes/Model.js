Ext.define('SamosAdmin.atualizacao.operacoes.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'OPERACOES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/operacoes'
    },

    constructor: function () {
        this.defaultValues = {
            'OPERACOES_TIPO': 'E',
            'OPERACOES_ESTOQUE': 'C',
            'OPERACOES_FINANCEIRO': 'N',
            'OPERACOES_FINALIDADE' : 'N',
            'OPERACOES_ACAO': 'NG',
            'OPERACOES_GRAFICO': 'F',
            'OPERACOES_CSTPIS': '49',
            'OPERACOES_CSTCOFINS': '49'
        };
        this.callParent(arguments);
    },

    fields: [
        'OPERACOES_ID', //INTEGER NOT NULL
        {
            defaultValue: 'T',
            name: 'OPERACOES_STATUS', //  CHAR(1)
            type: 'check'
        },
        {
            defaultValue: 'T',
            name: 'OPERACOES_BAIXAVISTA', //  CHAR(1)
            type: 'check'
        },
        {
            defaultValue: 'F',
            name: 'OPERACOES_COMPLEMENTAR', //  CHAR(1)
            type: 'check'
        },
        {
            name: 'OPERACOES_NOME', //  VARCHAR(50),
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'OPERACOES_ICMS', // CHAR(1)
            defaultValue: 'F',
            type: 'check',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 1}
            ]
        },
        {
            name: 'OPERACOES_IPI', // CHAR(1),
            defaultValue: 'F',
            type: 'check',            
            validators: [
                {type: 'presence'},
                {type: 'length', max: 1}
            ]
        },
        {
            name: 'OPERACOES_ST', // CHAR(1),
            defaultValue: 'F',
            type: 'check',            
            validators: [
                {type: 'presence'},
                {type: 'length', max: 1}
            ]
        },
        {
            name: 'OPERACOES_PISCOFINS', // CHAR(1),
            defaultValue: 'F',
            type: 'check',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 1}
            ]
        },        
        {
            name: 'OPERACOES_SOBRETOTAL', // CHAR(1),
            type: 'check',
            defaultValue: 'F',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 1}
            ]
        },
        {
            name: 'OPERACOES_CUSTO', // CHAR(1),
            defaultValue: 'F',
            type: 'check',            
            validators: [
                {type: 'presence'},
                {type: 'length', max: 1}
            ]
        },
        {
            name: 'OPERACOES_UNICA', // CHAR(1),
            defaultValue: 'F',  
            type: 'check',                      
            validators: [
                {type: 'presence'},
                {type: 'length', max: 1}
            ]
        },
        'OPERACOES_GRAFICO',
        'OPERACOES_ID_PRAZOS',
        'PRAZOS_NOME',
        {
            name: 'OPERACOES_TIPO', //  CHAR(1),
            validators: [
                {type: 'presence'},
                {type: 'length', max: 1},
            ]
        },
        {
            name: 'OPERACOES_ESTOQUE', //  CHAR(1),
            validators: [
                {type: 'presence'},
                {type: 'length', max: 1}
            ]
        },
        {
            name: 'OPERACOES_FINANCEIRO', // CHAR(1),
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'OPERACOES_FINALIDADE', // CHAR(1),
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'OPERACOES_ACAO',           
            validators: [
                {type: 'presence'},
                {type: 'length', max: 2}
            ]
        },
        {
            name: 'OPERACOES_CSTPIS',           
            validators: [
                {type: 'presence'},
                {type: 'length', max: 2}
            ]
        },
        {
            name: 'OPERACOES_CSTCOFINS',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 2}
            ]
        },
        'OPERACOES_ID_APLICACOES',
        'APLICACOES_NOME'
    ]
});
