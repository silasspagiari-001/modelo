Ext.define('SamosAdmin.atualizacao.aplicacoes.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'APLICACOES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/aplicacoes'
    },

    constructor: function () {
        this.defaultValues = {
            'APLICACOES_STATUS':   'A',
            'APLICACOES_TIPO':     'D',
            'APLICACOES_MASCARA': ''
        };
        this.callParent(arguments);
    },
    fields: [
        'APLICACOES_ID',
        {
            name: 'APLICACOES_STATUS',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'APLICACOES_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'APLICACOES_MASCARA',
            validators: [
                {type: 'length', max: 13}
            ]
        },
        {
            name: 'APLICACOES_TIPO',
            validators: [
                {type: 'presence'}
            ]
        }
    ]
});
