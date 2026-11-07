Ext.define('SamosAdmin.relatorios.contascorrentes.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscontascorrentes',

    requires: [
        'SamosAdmin.relatorios.contascorrentes.list.View'
    ],

    title: 'Relatório de Bancos',
    width: 800, // 700
    height: 230,
    autoShow: true,

    items: {
        xtype: 'relatorioscontascorrenteslist'
    }
});
