Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSITENS_ID_MOVIMENTOS',

    proxy: {
        type: 'nodejsrest',
        url: 'server/agendaromaneiomontagem'
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
            name: 'MOVIMENTOSITENS_DATAMONTAGEM',
            critical: true
        },
        {
            name: 'MOVIMENTOSITENS_HORAMONTAGEM',
            critical: true
        },
        'MOVIMENTOSITENS_DATAENTREGA',
        'MOVIMENTOSITENS_HORAENTREGA',
        'MOVIMENTOS_ITENS'
    ]
});
