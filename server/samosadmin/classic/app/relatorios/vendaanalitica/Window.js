Ext.define('SamosAdmin.relatorios.vendaanalitica.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendaanalitica',

    requires: [
        'SamosAdmin.relatorios.vendaanalitica.list.View'
    ],

    title: 'Venda Analítica',
    width: 562,
    height: 340,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendaanaliticalist'
    }
});
