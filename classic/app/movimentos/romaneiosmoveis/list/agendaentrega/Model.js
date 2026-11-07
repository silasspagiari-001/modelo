Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendaentrega.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSITENS_ID_MOVIMENTOS',

    proxy: {
        type: 'nodejsrest',
        url: 'server/agendaromaneioentrega'
    },

    fields: [
        'MOVIMENTOSITENS_ID_MOVIMENTOS',
        'MOVIMENTOS_ID_EMPRESAS',
        'MOVIMENTOS_NUMERO',
        'MOVIMENTOS_SERIE',
        'MOVIMENTOS_ID_PESSOAS',
        'MOVIMENTOS_NOME',
        'MOVIMENTOS_EMISSAO',
        'MOVIMENTOS_SITUACAO',
        'MOVIMENTOS_TOTAL',
        {
            name: 'MOVIMENTOSITENS_DATAENTREGA',
            critical: true
        },
        {
            name: 'MOVIMENTOSITENS_HORAENTREGA',
            critical: true
        },
        'MOVIMENTOSITENS_DATAMONTAGEM',
        'MOVIMENTOSITENS_HORAMONTAGEM',
        'MOVIMENTOS_ITENS'
    ]
});
