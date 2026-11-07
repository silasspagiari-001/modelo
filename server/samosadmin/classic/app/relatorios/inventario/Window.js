Ext.define('SamosAdmin.relatorios.inventario.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosinventario',

    requires: [
        'SamosAdmin.relatorios.inventario.list.View'
    ],

    title: 'Inventário de Produtos',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosinventariolist'
    }
});
