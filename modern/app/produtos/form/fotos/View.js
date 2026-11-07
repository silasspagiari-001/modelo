Ext.define('SamosAdminModern.produtos.form.fotos.View', {
    extend: 'Ext.Dialog',
    xtype: 'produtosfotos',
    width: '100%',
    height: '95%',
    maximized: true,
    closable: true,
    title: 'Fotos (Toque nelas para abrir)',

    requires: [
        'SamosAdminModern.produtos.form.fotos.ViewController',
        'SamosAdminModern.produtos.form.fotos.ViewModel'
    ],

    controller: 'produtosfotos',
    viewModel: 'produtosfotos',
    
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

    cls: 'produtosfotos-cls',
    scrollable: true,

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
                scrollable: true,
                height: 500,
                items: [
                    {
                        xtype: 'list',
                        reference: 'listafotos',
                        cls: `listfotos list-${tema}`,
                        margin: '0',
                        padding: '0',
                        itemTpl: `<table class='itemfoto-cls'>
                            <tr>
                                <td style="width:100%;font-weight:bold">{PRODUTOSFOTOS_DESCRICAO}</td>
                            </tr>
                        </table>`,
                        style: {
                            backgroundColor: 'transparent'
                        },
                        bind: {
                            store: '{main}'
                        },
                        disableSelection: true,
                        grouped: true,
                        indexBar: false,
                        singleSelect: true,
                        multiSelect: false,
                        onItemDisclosure: false,
                        hideOnMaskTap: true,
                        scrollable: {
                            direction: 'vertical',
                            directionLock: true
                        },
                        pinHeaders: false,
                        listeners: {
                            itemtap: 'onItemClick'
                        }
                    }
                ]
            }
        ]);
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})