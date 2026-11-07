Ext.define('SamosAdmin.atualizacao.pessoas.form.documentos.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formpessoasdocumentos',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.documentos.ViewModel',
        'SamosAdmin.atualizacao.pessoas.form.documentos.ViewController'
    ],

    title: 'Documentos',
    modelName: 'SamosAdmin.atualizacao.pessoas.form.documentos.Model',
    hidePaging: true,

    leftbuttons: [
        'Visualizar',
        'Baixar',
        'Excluir',
        'Carregar',
        {
            type: 'file',
            accept: '*/*',
            hidden: true,
            action: 'CarregarArquivo'
        }
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            selModel: {
                selType: 'checkboxmodel',
                showHeaderCheckbox: true,
                mode: 'MULTI',
                checkOnly: true,
                injectCheckbox: 1
            },
            columns: [
                {
                    text: 'Número',
                    dataIndex: 'PESSOASDOCUMENTOS_NUMERO',
                    width: 80,
                    align: 'center'
                },
                {
                    text: 'Documento',
                    dataIndex: 'PESSOASDOCUMENTOS_DOCUMENTO',
                    width: 180
                },
                {
                    width: 100,
                    text: 'Inclusão',
                    xtype: 'datecolumn',
                    dataIndex: 'PESSOASDOCUMENTOS_INCLUSAO',
                    align: 'center'
                },
                {
                    width: 100,
                    text: 'Validade',
                    xtype: 'datecolumn',
                    dataIndex: 'PESSOASDOCUMENTOS_VALIDADE',
                    align: 'center'
                },
                {
                    text: 'Log',
                    dataIndex: 'PESSOASDOCUMENTOS_LOG',
                    flex: 1
                }
            ]
        });
        
        this.callParent(arguments);        
    }
});