Ext.define('SamosAdmin.relatorios.demonstrativo.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosdemonstrativo',

    requires: [
        'SamosAdmin.relatorios.demonstrativo.list.View'
    ],

    title: 'Demonstrativo',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosdemonstrativolist'
    }
});
