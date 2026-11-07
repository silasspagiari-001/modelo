Ext.define('SamosAdmin.consultas.precoproduto.ModelLotes', {
    extend: 'Ext.data.NodeJSModel',
    fields: [
        'LOTES_ID',
        'LOTES_ID_PRODUTOS',
        'LOTES_REFERENCIA',
        'LOTES_FABRICACAO',
        'LOTES_VALIDADE',
        'LOTES_SALDO',
        'PRODUTOS_NOME'
    ]
});
