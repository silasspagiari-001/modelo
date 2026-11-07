Ext.define('SamosAdmin.relatorios.estoquelotes.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosestoquelotes',

    requires: [
        'SamosAdmin.relatorios.estoquelotes.list.View'
    ],

    title: 'Saldos e validades lotes',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosestoqueloteslist'
    }
});
