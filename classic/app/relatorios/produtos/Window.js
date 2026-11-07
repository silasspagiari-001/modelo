Ext.define('SamosAdmin.relatorios.produtos.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosprodutos',

    requires: [
        'SamosAdmin.relatorios.produtos.list.View'
    ],

    title: 'Produtos',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosprodutoslist'
    }
});
