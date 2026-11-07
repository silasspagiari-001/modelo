Ext.define('SamosAdmin.relatorios.ordemcarregamento.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosordemcarregamento',

    requires: [
        'SamosAdmin.relatorios.ordemcarregamento.list.View'
    ],

    title: 'Ordem de carregamento',
    width: 300, //480
    height: 230, //295
    autoShow: true,

    items: {
        xtype: 'relatoriosordemcarregamentolist'
    }
});
