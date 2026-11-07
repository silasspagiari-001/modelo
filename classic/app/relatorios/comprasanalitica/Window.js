Ext.define('SamosAdmin.relatorios.comprasanalitica.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscomprasanalitica',

    requires: [
        'SamosAdmin.relatorios.comprasanalitica.list.View'
    ],

    title: 'Compras Analitica',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscomprasanaliticalist'
    }
});
