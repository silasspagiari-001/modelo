Ext.define('SamosAdminModern.produtos.form.fotos.exibirfoto.View', {
    extend: 'Ext.Dialog',
    xtype: 'produtosfotosexibir',
    width: '100%',
    height: '95%',
    maximized: true,
    closable: true,
    title: 'Foto',

    requires: [
        'SamosAdminModern.produtos.form.fotos.exibirfoto.ViewController',
        'SamosAdminModern.produtos.form.fotos.exibirfoto.ViewModel'
    ],

    controller: 'produtosfotosexibir',
    viewModel: 'produtosfotosexibir',
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    listeners: {
        show: 'showButtons'
    },

    style: {
        backgroundColor: 'transparent'
    },

    cls: 'produtosfotosexibirexibir-cls',

    initialize: function() {
        const tema = configs.getTema();
        
        this.callParent(arguments);

        this.setItems([
            {
                xtype: 'container',
                layout: 'hbox',
                items: [
                    {
                        xtype: 'button',
                        flex: 1,
                        cls: 'btn-fechar-dialog',
                        text: 'Voltar',
                        handler: 'onSairClick'
                    }
                ]
            },
            {
                xtype: 'container',
                layout: 'hbox',
                items: [
                    {
                        xtype: 'container',
                        reference: 'foto',
                        flex: 1
                    }
                ]
            }
        ]);
    }
})