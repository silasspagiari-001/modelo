Ext.define('SamosAdmin.relatorios.listacompras.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioslistacompras',

    requires: [
        'SamosAdmin.relatorios.listacompras.list.View'
    ],

    title: 'Relação para Compras',
    width: 480,
    height: 225,
    autoShow: true,

    items: {
        xtype: 'relatorioslistacompraslist'
    }
});
