Ext.define('SamosAdmin.relatorios.producoes.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosproducoes',

    requires: [
        'SamosAdmin.relatorios.producoes.list.View'
    ],

    title: 'Produções',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosproducoeslist'
    }
});
