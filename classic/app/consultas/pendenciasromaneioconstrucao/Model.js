Ext.define('SamosAdmin.consultas.pendenciasromaneioconstrucao.Model', {
    extend: 'Ext.data.NodeJSModel',
    fields: [
        'MOVIMENTOS_EMISSAO',
        'MOVIMENTOS_ID',
        'PRODUTOS_ID',
        'PRODUTOS_NOME',
        'MOVIMENTOSITENS_QUANTIDADE',
        'TOTAL_ENTREGUE',
        'TOTAL_AENTREGAR'
    ]
});
