Ext.define('SamosAdmin.movimentos.ordensproducao.formulas.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PRODUCOESFORMULAS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ordensproducaoformulas'
    },

    constructor: function () {
        this.defaultValues = {
            'PRODUCOESFORMULAS_STATUS': 'T',
            'PRODUCOESFORMULAS_LOG'   : SamosUtils.Info.getLog()
        };

        this.callParent(arguments);
    },

    fields: [
        'PRODUCOESFORMULAS_ID',
        'PRODUCOESFORMULAS_ID_PRODUTOS',
        {
            name: 'PRODUCOESFORMULAS_STATUS',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'PRODUCOESFORMULAS_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        'PRODUCOESFORMULAS_LOG',
        'PRODUCOESFORMULAS_ITENS'//lista de ModelItens
    ]
});
