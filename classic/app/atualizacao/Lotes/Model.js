Ext.define('SamosAdmin.atualizacao.lotes.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'LOTES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/lotes'
    },

    constructor: function () {
        this.defaultValues = {
            'LOTES_ID_EMPRESAS': configs.getEmpresa().id,            
            'LOTES_STATUS': 'T'
        };
        this.callParent(arguments);
    },
    fields: [
        'LOTES_ID',
        {
            name: 'LOTES_STATUS',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'LOTES_NOME',
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'LOTES_ID_PRODUTOS',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'LOTES_REFERENCIA',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 20}
            ]
        },
        {
            name: 'LOTES_LOCALIZACAO',
            validators: [
                {type: 'length', max: 13}
            ]
        },
        {
            name: 'LOTES_EMISSAO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'LOTES_FABRICACAO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'LOTES_VALIDADE',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'LOTES_QUANTIDADE',
        'VENDIDO_LOTES',
        'LOTES_SALDO',
        'LOTES_LOG'  
    ]
});
