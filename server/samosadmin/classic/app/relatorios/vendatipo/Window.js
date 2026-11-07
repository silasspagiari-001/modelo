Ext.define('SamosAdmin.relatorios.vendatipo.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendatipo',

    requires: [
        'SamosAdmin.relatorios.vendatipo.list.View'
    ],

    title: 'Venda Tipo Recebimento',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendatipolist'
    }
});
