Ext.define('SamosAdmin.relatorios.vendaspessoasanalitica.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendaspessoasanalitica',

    requires: [
        'SamosAdmin.relatorios.vendaspessoasanalitica.list.View'
    ],

    title: 'Vendas por Pessoa Analítica',
    width: 700,
    height: 335,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendaspessoasanaliticalist'
    }
});
