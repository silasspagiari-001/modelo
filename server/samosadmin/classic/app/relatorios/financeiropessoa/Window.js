Ext.define('SamosAdmin.relatorios.financeiropessoa.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosfinanceiropessoa',

    requires: [
        'SamosAdmin.relatorios.financeiropessoa.list.View'
    ],

    title: 'Resumo Receber/Pagar por pessoa',
    width: 800,
    height: 485,  //530
    autoShow: true,

    items: {
        xtype: 'relatoriosfinanceiropessoalist'
    }
});
