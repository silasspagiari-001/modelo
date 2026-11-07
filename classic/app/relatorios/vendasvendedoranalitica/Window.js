Ext.define('SamosAdmin.relatorios.vendasvendedoranalitica.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendasvendedoranalitica',

    requires: [
        'SamosAdmin.relatorios.vendasvendedoranalitica.list.View'
    ],

    title: 'Vendas por Vendedor Analítica',
    width: 700,
    height: 335,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendasvendedoranaliticalist'
    }
});
