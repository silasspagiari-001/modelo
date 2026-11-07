Ext.define('SamosAdmin.relatorios.baixas.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosbaixas',

    requires: [
        'SamosAdmin.relatorios.baixas.list.View'
    ],

    title: 'Baixas Financeiro',
    width: 700,
    height: 230, //335
    autoShow: true,

    items: {
        xtype: 'relatoriosbaixaslist'
    }
});
