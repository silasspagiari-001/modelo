Ext.define('SamosAdmin.relatorios.vendasfornecedorsintetica.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendasfornecedorsintetica',

    requires: [
        'SamosAdmin.relatorios.vendasfornecedorsintetica.list.View'
    ],

    title: 'Vendas por Fornecedor Sintética',
    width: 600,
    height: 330, // 280
    autoShow: true,

    items: {
        xtype: 'relatoriosvendasfornecedorsinteticalist'
    }
});
