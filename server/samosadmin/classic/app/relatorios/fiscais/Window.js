Ext.define('SamosAdmin.relatorios.fiscais.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosfiscais',

    requires: [
        'SamosAdmin.relatorios.fiscais.list.View'
    ],

    title: 'Registros Fiscais',
    width: 450,
    height: 225, 
    autoShow: true,

    items: {
        xtype: 'relatoriosfiscaislist'
    }
});
