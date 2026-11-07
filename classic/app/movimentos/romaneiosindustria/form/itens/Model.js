Ext.define('SamosAdmin.movimentos.romaneiosindustria.form.itens.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSITENS_ID',
    idParent:   'MOVIMENTOSITENS_ID_MOVIMENTOS',     

    proxy: {
        type: 'nodejsrest'
    },

    fields: [
        'MOVIMENTOSITENS_ID',
        'MOVIMENTOSITENS_ID_MOVIMENTOS',
        'PRODUTOS_NOME',
        'PRODUTOS_APLICACAO',
        'MOVIMENTOSITENS_QUANTIDADE',
        'MOVIMENTOSITENS_HORAMONTAGEM'
    ]
});
