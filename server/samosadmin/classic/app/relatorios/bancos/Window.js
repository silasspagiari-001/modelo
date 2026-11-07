Ext.define('SamosAdmin.relatorios.bancos.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosbancos',

    requires: [
        'SamosAdmin.relatorios.bancos.list.View'
    ],

    title: 'Posição Financeira Bancos',
    width: 540,
    height: 310,
    autoShow: true,

    items: {
        xtype: 'relatoriosbancoslist'
    }
});
