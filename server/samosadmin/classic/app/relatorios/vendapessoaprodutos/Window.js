Ext.define('SamosAdmin.relatorios.vendaspessoaprodutos.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendaspessoaprodutos',

    requires: [
        'SamosAdmin.relatorios.vendaspessoaprodutos.list.View'
    ],

    title: 'Vendas por Pessoa Produtos',
    width: 750, // 700
    height: 280,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendaspessoaprodutoslist'
    }
});
