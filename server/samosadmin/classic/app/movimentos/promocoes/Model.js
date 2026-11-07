Ext.define('SamosAdmin.movimentos.promocoes.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PROMOCOES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/promocoes',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'PROMOCOES_NOME'         : `PROMOÇÃO ${Ext.Date.monthNames[momentServer().month()].toUpperCase()} 1`,
            'PROMOCOES_CUSTOTECNICO' : 0,
            'PROMOCOES_DESCONTO'     : 0,
            'PROMOCOES_DESCONTOA'    : 0,
            'PROMOCOES_DESCONTOB'    : 0,
            'PROMOCOES_DESCONTOC'    : 0,
            'PROMOCOES_INDICE'       : 0,
            'PROMOCOES_PARCELAS'     : 1,
            'PROMOCOES_EMISSAO'      : momentServer().startOf('month').format('DD/MM/YYYY'),
            'PROMOCOES_VALIDADE'     : momentServer().endOf('month').format('DD/MM/YYYY'),
            'PROMOCOES_LOG'          : SamosUtils.Info.getLog(),
            'PROMOCOES_EMPRESAS'     : ''
        };

        this.callParent(arguments);
    },

    fields: [
        'PROMOCOES_ID',
        {
            name: 'PROMOCOES_STATUS',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'PROMOCOES_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PROMOCOES_EMISSAO', 
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PROMOCOES_VALIDADE',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PROMOCOES_EMPRESAS',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },   
        'PROMOCOES_LOG',
        {
            name: 'PROMOCOES_CUSTOTECNICO',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PROMOCOES_DESCONTO',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PROMOCOES_INDICE',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PROMOCOES_PARCELAS',
            validators: [
                {type: 'presence'}
            ]
        },
        'PROMOCOES_ITENS' // lista de ModelItens
    ]
});
