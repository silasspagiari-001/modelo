Ext.define('SamosAdmin.relatorios.comissoespro.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscomissoespro',

    requires: [
        'SamosAdmin.relatorios.comissoespro.list.View'
    ],

    title: 'Comissões Pro',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscomissoesprolist'
    }
});
