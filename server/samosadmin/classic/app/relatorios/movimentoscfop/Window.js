Ext.define('SamosAdmin.relatorios.movimentoscfop.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosmovimentoscfop',

    requires: [
        'SamosAdmin.relatorios.movimentoscfop.list.View'
    ],

    title: 'Movimentos CFOP Entrada/Saída',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosmovimentoscfoplist'
    }
});
