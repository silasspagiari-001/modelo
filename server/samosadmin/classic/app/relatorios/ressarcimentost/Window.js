Ext.define('SamosAdmin.relatorios.ressarcimentost.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosressarcimentost',

    requires: [
        'SamosAdmin.relatorios.ressarcimentost.list.View'
    ],

    title: 'Ressarcimento de ST',
    width: 400, // 700
    height: 180, // 335
    autoShow: true,

    items: {
        xtype: 'relatoriosressarcimentostlist'
    }
});
