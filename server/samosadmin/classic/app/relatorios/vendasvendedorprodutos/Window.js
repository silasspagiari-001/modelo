Ext.define('SamosAdmin.relatorios.vendasvendedorprodutos.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendasvendedorprodutos',

    requires: [
        'SamosAdmin.relatorios.vendasvendedorprodutos.list.View'
    ],

    title: 'Vendas por Vendedor Produtos',
    width: 750, // 700
    height: 280,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendasvendedorprodutoslist'
    }
});
