Ext.define('SamosAdmin.relatorios.vendasproduto.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendasproduto',

    requires: [
        'SamosAdmin.relatorios.vendasproduto.list.View'
    ],

    title: 'Vendas Produto Sintética',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendasprodutolist'
    }
});
