Ext.define('SamosAdmin.relatorios.caixasintetico.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscaixasintetico',

    requires: [
        'SamosAdmin.relatorios.caixasintetico.list.View'
    ],

    title: 'Fluxo de Caixa Sintético',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscaixasinteticolist'
    }
});
