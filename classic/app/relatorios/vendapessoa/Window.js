Ext.define('SamosAdmin.relatorios.vendapessoa.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendapessoa',

    requires: [
        'SamosAdmin.relatorios.vendapessoa.list.View'
    ],

    title: 'Venda Pessoa',
    width: 862,
    height: 405,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendapessoalist'
    }
});
