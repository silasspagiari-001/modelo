Ext.define('SamosAdmin.relatorios.compras.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscompras',

    requires: [
        'SamosAdmin.relatorios.compras.list.View'
    ],

    title: 'Compras Produtos',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscompraslist'
    }
});
