Ext.define('SamosAdmin.relatorios.pessoas.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriospessoas',

    requires: [
        'SamosAdmin.relatorios.pessoas.list.View'
    ],

    title: 'Pessoas',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriospessoaslist'
    }
});
