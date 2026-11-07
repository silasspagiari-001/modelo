Ext.define('SamosAdmin.atualizacao.relacoes.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'RELACOES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/relacoes'
    },

    constructor: function () {
        this.defaultValues = {
            'RELACOES_ID_PESSOAS': configs.getEmpresa().id,
            'RELACOES_FATOR': 1,
            'RELACOES_SIGLA': 'UN'
        };

        this.callParent(arguments);
    },

    fields: [
        'RELACOES_ID',
        {
            name: 'RELACOES_ID_PESSOAS',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PESSOAS_NOME',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'RELACOES_ID_PRODUTOS',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'RELACOES_FABRICA',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 20}
            ]
        },
        {
            name: 'RELACOES_BARRAS',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'RELACOES_SIGLA',
            validators: [
                {type: 'length', max: 10}
            ]
        },
        'RELACOES_FATOR'
    ]
});
