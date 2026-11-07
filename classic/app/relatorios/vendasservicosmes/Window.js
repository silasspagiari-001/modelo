Ext.define('SamosAdmin.relatorios.vendasservicosmes.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendasservicosmes',

    requires: [
        'SamosAdmin.relatorios.vendasservicosmes.list.View'
    ],

    title: 'Vendas de serviços mês',
    width: 350,
    height: 250,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendasservicosmeslist'
    }
});
