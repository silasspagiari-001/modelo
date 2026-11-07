Ext.define('SamosAdmin.relatorios.comissoesfin.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscomissoesfin',

    requires: [
        'SamosAdmin.relatorios.comissoesfin.list.View'
    ],

    title: 'Comissões Fin',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscomissoesfinlist'
    }
});
