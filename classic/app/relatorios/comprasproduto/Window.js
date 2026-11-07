Ext.define('SamosAdmin.relatorios.comprasproduto.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscomprasproduto',

    requires: [
        'SamosAdmin.relatorios.comprasproduto.list.View'
    ],

    title: 'Compras Produto Sintética',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscomprasprodutolist'
    }
});
