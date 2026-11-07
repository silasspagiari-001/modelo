Ext.define('SamosAdmin.relatorios.resultados.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosresultados',

    requires: [
        'SamosAdmin.relatorios.resultados.list.View'
    ],

    title: 'Resultados Caixa',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosresultadoslist'
    }
});
