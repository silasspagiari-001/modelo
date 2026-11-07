Ext.define('SamosAdmin.movimentos.promocoes.ModelItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PROMOCOESITENS_ID',
    idParent: 'PROMOCOESITENS_ID_PROMOCOES',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'PROMOCOESITENS_CUSTOTECNICO' : 0,
            'PROMOCOESITENS_DESCONTO'     : 0,
            'PROMOCOESITENS_INDICE'       : 0,
            'PROMOCOESITENS_PARCELAS'     : 1
        };

        this.callParent(arguments);
    },

    fields: [
        'PROMOCOESITENS_ID',
        'PROMOCOESITENS_ID_PROMOCOES',
        {
            name: 'PROMOCOESITENS_ID_PRODUTOS',
            validators: [
                {type: 'presence'}
            ]
        },
        'PRODUTOS_NOME',
        'PRODUTOS_MARCA',
        'PRODUTOS_APLICACAO',
        'PRODUTOS_UNIDADE',
        'SALDOS_PRECOMINIMO',
        'SALDOS_PRECO',
        'PROMOCOES_EMPRESAS',
        {
            name: 'PROMOCOESITENS_VALOR',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PROMOCOESITENS_VALORA'
        },
        {
            name: 'PROMOCOESITENS_VALORB'
        },
        {
            name: 'PROMOCOESITENS_VALORC'
        },
        'PROMOCOESITENS_CUSTOTECNICO',
        'PROMOCOESITENS_DESCONTO',
        'PROMOCOESITENS_INDICE',
        'PROMOCOESITENS_PARCELAS',
        {
            name: 'TOTALPARCELAS_ITENS',
            persist: false
        }
    ]
});
