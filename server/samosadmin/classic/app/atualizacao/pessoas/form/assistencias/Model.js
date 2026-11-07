Ext.define('SamosAdmin.atualizacao.pessoas.form.assistencias.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENS_ID',

    proxy: {
        type: 'nodejsrest',
         url: 'server/assistencias'
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENS_ID_EMPRESAS'  : configs.getEmpresa().id, 
            'ORDENS_ID_DOCUMENTOS': configs.getEmpresa().id.toString() + '0020',
            'ORDENS_STATUS'      : 'T',
            'ORDENS_EMISSAO'     : momentServer().format('YYYY-MM-DD')
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENS_ID',
        'ORDENS_ID_EMPRESAS',
        'ORDENS_ID_DOCUMENTOS',
        {
            name: 'ORDENS_STATUS',//  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'ORDENS_EMISSAO',
            type: 'nodejsdate',
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'ORDENS_NUMERO',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'ORDENS_ID_PESSOAS',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'ORDENS_REFERENCIA',
            critical: true,
            validators: [
                { type: 'presence' },
                { type: 'length', max: 100 }
            ]
        },
        'ORDENS_OBSERVACOES'
    ]
});
