Ext.define('SamosAdmin.emissao.Etiqueta', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ETIQUETAS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/etiquetas'
    },

    constructor: function () {
        this.defaultValues = {
            'ETIQUETAS_ID_EMPRESAS': configs.getEmpresa().id,
            'ETIQUETAS_EMISSAO'    : momentServer().format('YYYY-MM-DD'),
            'ETIQUETAS_STATUS'     : 'F',//F: Não Impressa | I: Imprimindo | T: Impressa
            'ETIQUETAS_LAYOUT'     : '',
            'ETIQUETAS_LOG'        : SamosUtils.Info.getLog()
        };

        this.callParent(arguments);
    },

    fields: [
        'ETIQUETAS_ID',
        'ETIQUETAS_ID_EMPRESAS',
        {
            name: 'ETIQUETAS_STATUS',
            critical: true
        },
        {
            name: 'ETIQUETAS_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'ETIQUETAS_EMISSAO',
            type: 'nodejsdate'
        },
        'ETIQUETAS_LAYOUT',
        'ETIQUETAS_LOG',
        'ETIQUETAS_ITENS'
    ]
});
