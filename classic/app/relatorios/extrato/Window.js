Ext.define('SamosAdmin.relatorios.extrato.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosextrato',

    requires: [
        'SamosAdmin.relatorios.extrato.list.View'
    ],

    title: 'Extrato',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosextratolist'
    }
});
