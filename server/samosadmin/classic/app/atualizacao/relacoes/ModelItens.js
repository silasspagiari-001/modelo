Ext.define('SamosAdmin.atualizacao.relacoes.ModelItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'RELACOESITENS_ID',
    idParent: 'RELACOESITENS_ID_MOVIMENTOS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'RELACOESITENS_FATOR' : 1
        };

        this.callParent(arguments);
    },

    fields: [
        'RELACOESITENS_ID',
        'RELACOESITENS_ID_MOVIMENTOS',
        'RELACOESITENS_ID_ITENS',
        'RELACOESITENS_NOME',
        'RELACOESITENS_SIGLA', 
        'RELACOESITENS_FABRICA', 
        'RELACOESITENS_BARRAS',
        'RELACOESITENS_FATOR'
    ]
});
