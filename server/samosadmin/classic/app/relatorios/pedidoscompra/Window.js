Ext.define('SamosAdmin.relatorios.pedidoscompra.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriospedidoscompra',

    requires: [
        'SamosAdmin.relatorios.pedidoscompra.list.View'
    ],

    title: 'Pedidos de Compra',
    width: 640, 
    height: 230,  // 295
    autoShow: true,

    items: {
        xtype: 'relatoriospedidoscompralist'
    }
});
