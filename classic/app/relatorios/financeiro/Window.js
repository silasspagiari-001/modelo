Ext.define('SamosAdmin.relatorios.financeiro.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosfinanceiro',

    requires: [
        'SamosAdmin.relatorios.financeiro.list.View'
    ],

    title: 'Títulos a Receber/Pagar',
    width: 800,
    height: 530,  //480
    autoShow: true,

    items: {
        xtype: 'relatoriosfinanceirolist'
    }
});
