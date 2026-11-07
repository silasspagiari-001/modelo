Ext.define('SamosAdmin.atualizacao.servicos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'SERVICOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/servicos'
   },

    constructor: function () {
        this.defaultValues = {
            'SERVICOS_STATUS' : 'T',
            'SERVICOS_DESCRICAO': ''
       };
       this.callParent(arguments);
    },
    fields: [
        'SERVICOS_ID',
        {
            name: 'SERVICOS_STATUS',       ///  CHAR(1) NOT NULL
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'SERVICOS_CODIGO',
            validators: [
                {type: 'length', max: 20}
            ]
        },
        {
            name: 'SERVICOS_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },        
        {
            name: 'SERVICOS_DESCRICAO',
            validators: [
                {type: 'length', max: 512}
            ]
        },
        {
            name: 'SERVICOS_ISS',        // NUMERIC(7, 3)
            validators: [
                {type: 'presence'}
            ]
        },        
        {
            name: 'SERVICOS_PRECO',     // NUMERIC(12, 2)
            validators: [
                {type: 'presence'}
            ]
        },        
    ]
});
