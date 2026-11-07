Ext.define('SamosAdmin.relatorios.movimentos.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosmovimentos',

    requires: [
        'SamosAdmin.relatorios.movimentos.list.View'
    ],

    title: 'Movimentos',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosmovimentoslist'
    }
});
