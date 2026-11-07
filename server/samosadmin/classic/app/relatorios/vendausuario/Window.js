Ext.define('SamosAdmin.relatorios.vendausuario.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendausuario',

    requires: [
        'SamosAdmin.relatorios.vendausuario.list.View'
    ],

    title: 'Venda Vendedor',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendausuariolist'
    }
});
