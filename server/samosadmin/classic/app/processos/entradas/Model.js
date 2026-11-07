Ext.define('SamosAdmin.processos.entradas.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSITENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/processosentradas'
    },

    fields: [        
        'MOVIMENTOSITENS_ID',
        'MOVIMENTOSITENS_ID_MOVIMENTOS',
        'MOVIMENTOSITENS_ID_OPERACOES',
        'MOVIMENTOSITENS_ID_PRODUTOS',
        'MOVIMENTOSITENS_ID_LOTES',
        'MOVIMENTOSITENS_QUANTIDADE',
        'MOVIMENTOSITENS_PRECO',
        'MOVIMENTOSITENS_TOTAL',
        'PRODUTOS_DERIVADO',
        'PRODUTOS_NOME',
        'LOTES_REFERENCIA',
        'LOTES_ID_PRODUTOS',
        'LOTES_FABRICACAO',
        'LOTES_VALIDADE',
        'MOVIMENTOS_ID',
        'MOVIMENTOS_NUMERO',
        'MOVIMENTOS_SERIE',
        'MOVIMENTOS_EMISSAO',
        'MOVIMENTOS_ENTRADASAIDA',
        'PESSOAS_NOME'
    ]
});
