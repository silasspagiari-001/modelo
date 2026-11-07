Ext.define('SamosAdmin.atualizacao.cargas.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'CARGAS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/cargas'
    },

    fields: [
        'CARGAS_ID',
        'CARGAS_NUMERO',
        'CARGAS_PLACAVEICULO',
        'CARGAS_PLACAUFVEICULO',
        'CARGAS_SERIE',        
        'CARGAS_TRANSPNOME',
        'CARGAS_TRANSPCPFCNPJ'
    ]
});