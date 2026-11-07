Ext.define('SamosAdmin.relatorios.saldoscomparativo.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriossaldoscomparativo',

    requires: [
        'SamosAdmin.relatorios.saldoscomparativo.list.View'
    ],

    title: 'Saldos Comparativo',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriossaldoscomparativolist'
    }
});
