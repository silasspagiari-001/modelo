Ext.define('SamosAdmin.consultas.comprasvendaslote.Model', {
    extend: 'Ext.data.NodeJSModel',
    fields: [
        'MOVIMENTOS_EMISSAO',
        'MOVIMENTOS_ID',
        'PESSOAS_ID',
        'PESSOAS_NOME',
        'MOVIMENTOSITENS_QUANTIDADE',
        'MOVIMENTOSITENS_PRECO',
        'MOVIMENTOSITENS_TOTAL'
    ]
});
