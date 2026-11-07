Ext.define('SamosAdmin.relatorios.livrocontrolado.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioslivrocontrolado',

    requires: [
        'SamosAdmin.relatorios.livrocontrolado.list.View'
    ],

    title: 'Livro Produto Controlado',
    width: 482,
    height: 250,
    autoShow: true,

    items: {
        xtype: 'relatorioslivrocontroladolist'
    }
});
