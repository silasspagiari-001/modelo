Ext.define('SamosAdmin.relatorios.lucratividade.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioslucratividade',

    requires: [
        'SamosAdmin.relatorios.lucratividade.list.View'
    ],

    title: 'Lucratividade',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioslucratividadelist'
    }
});
