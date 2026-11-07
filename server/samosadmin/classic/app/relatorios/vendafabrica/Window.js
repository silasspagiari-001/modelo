Ext.define('SamosAdmin.relatorios.vendafabrica.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendafabrica',

    requires: [
        'SamosAdmin.relatorios.vendafabrica.list.View'
    ],

    title: 'Venda Fábrica',
    width: 562,
    height: 330,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendafabricalist'
    }
});
