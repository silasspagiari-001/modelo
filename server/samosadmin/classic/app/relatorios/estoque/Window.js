Ext.define('SamosAdmin.relatorios.estoque.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosestoque',

    requires: [
        'SamosAdmin.relatorios.estoque.list.View'
    ],

    title: 'Estoque',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosestoquelist'
    }
});
