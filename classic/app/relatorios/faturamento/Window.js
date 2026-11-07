Ext.define('SamosAdmin.relatorios.faturamento.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosfaturamento',

    requires: [
        'SamosAdmin.relatorios.faturamento.list.View'
    ],

    title: 'Faturamento',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosfaturamentolist'
    }
});
