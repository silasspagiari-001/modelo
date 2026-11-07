Ext.define('SamosAdmin.relatorios.ordens.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosordens',

    requires: [
        'SamosAdmin.relatorios.ordens.list.View'
    ],

    title: 'Ordens',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosordenslist'
    }
});
