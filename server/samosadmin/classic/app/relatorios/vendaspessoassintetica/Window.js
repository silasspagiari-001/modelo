Ext.define('SamosAdmin.relatorios.vendaspessoassintetica.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendaspessoassintetica',

    requires: [
        'SamosAdmin.relatorios.vendaspessoassintetica.list.View'
    ],

    title: 'Vendas por Pessoa Sintética',
    width: 550,
    height: 280,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendaspessoassinteticalist'
    }
});
