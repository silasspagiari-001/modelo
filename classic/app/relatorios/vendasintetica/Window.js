Ext.define('SamosAdmin.relatorios.vendasintetica.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendasintetica',

    requires: [
        'SamosAdmin.relatorios.vendasintetica.list.View'
    ],

    title: 'Venda Sintética',
    width: 562,
    height: 350,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendasinteticalist'
    }
});
