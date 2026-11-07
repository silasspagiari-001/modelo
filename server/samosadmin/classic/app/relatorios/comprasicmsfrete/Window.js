Ext.define('SamosAdmin.relatorios.comprasicmsfrete.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscomprasicmsfrete',

    requires: [
        'SamosAdmin.relatorios.comprasicmsfrete.list.View'
    ],

    title: 'Compras ICMS/FRETE',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscomprasicmsfretelist'
    }
});
