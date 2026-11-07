Ext.define('SamosAdmin.relatorios.diariooprodutos.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosdiarioprodutos',

    requires: [
        'SamosAdmin.relatorios.diarioprodutos.list.View'
    ],

    title: 'Livro Diário Produtos',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosdiarioprodutoslist'
    }
});
