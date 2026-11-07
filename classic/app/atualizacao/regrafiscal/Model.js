Ext.define('SamosAdmin.atualizacao.regrafiscal.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'REGRAFISCAL_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/regrafiscal'
    },

    constructor: function () {
        this.defaultValues = {
            'REGRAFISCAL_STATUS': 'T'
        };
        this.callParent(arguments);
    },

    fields: [
        'REGRAFISCAL_ID', //INTEGER NOT NULL
        {
            defaultValue: 'T',
            name: 'REGRAFISCAL_STATUS', //  CHAR(1)
            type: 'check'
        },
        {
            name: 'REGRAFISCAL_NOME', //  VARCHAR(100),
            validators: [
                {type: 'presence'},
                {type: 'length', max: 100}
            ]
        },
        'REGRAFISCAL_OPERACAO',
        'REGRAFISCAL_CFOP',
        'REGRAFISCAL_NCMINICIAL',
        'REGRAFISCAL_NCMFINAL',
        'REGRAFISCAL_ORIGEM',
        'REGRAFISCAL_DESTINO',
        'REGRAFISCAL_PESSOA', // (F) ou (J)
        'REGRAFISCAL_CONTRIBUINTE',
        'REGRAFISCAL_CST',
        'REGRAFISCAL_CLASSTRIB',        
        'REGRAFISCAL_PRIORIDADE', // Integer
        {
            name: 'REGRAFISCAL_INICIO',
            type: 'nodejsdate',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'REGRAFISCAL_FINAL',
            type: 'nodejsdate',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        }
    ]
});