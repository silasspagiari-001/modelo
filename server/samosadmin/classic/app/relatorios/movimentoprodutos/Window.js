Ext.define('SamosAdmin.relatorios.movimentoprodutos.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosmovimentoprodutos',

    requires: [
        'SamosAdmin.relatorios.movimentoprodutos.list.View'
    ],

    title: 'Produtos Movimentados',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosmovimentoprodutoslist'
    }
});
