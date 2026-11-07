Ext.define('SamosAdmin.relatorios.saldos.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriossaldos',

    requires: [
        'SamosAdmin.relatorios.saldos.list.View'
    ],

    title: 'Saldos Produtos',
    width: 562,
    height: 390, //configs.getClientName() == 'turbotec' ? 500 : 335,
    autoShow: true,

    items: {
        xtype: 'relatoriossaldoslist'
    }
});
