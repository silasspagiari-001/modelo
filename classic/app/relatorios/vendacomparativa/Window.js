Ext.define('SamosAdmin.relatorios.vendacomparativa.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendacomparativa',

    requires: [
        'SamosAdmin.relatorios.vendacomparativa.list.View'
    ],

    title: 'Venda Comparativa',
    width: 562,
    height: 330,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendacomparativalist'
    }
});
