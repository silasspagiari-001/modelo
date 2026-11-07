Ext.define('SamosAdminModern.ceps.list.View', {
    extend: 'Ext.Panel',
    xtype: 'ceps',

    requires: [
        'SamosAdminModern.ceps.Model',
        'SamosAdminModern.ceps.list.ViewController',
        'SamosAdminModern.ceps.list.ViewModel'
    ],

    controller: 'ceps',
    viewModel: 'ceps',
    
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

    initialize: function() {
        const tema = configs.getTema();
        
        this.callParent(arguments);

        this.setItems([
            {
                xtype: 'container',
                height: 40,
                padding: 1,
                margin: 5,
                layout: 'hbox',
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                items: [
                    {
                        xtype: 'textfield',
                        reference: 'conteudo',
                        label: 'CEP/Endereço',
                        placeholder: 'Digite',
                        flex: 1,
                        margin: 0,
                        padding: 0,
                        style: {
                            paddingBottom: '0px'
                        },
                        bind: {
                            value: '{valueConteudo}'
                        }
                    },
                    {
                        xtype: 'image',
                        reference: 'pesquisar',
                        src: 'resources/images/buttons/pesquisar.png',
                        margin: 5,
                        width: 25,
                        height: 25,
                        listeners: {
                            initialize: function() {
                                this.el.dom.onclick = () => this.up('ceps').getController().onPesquisarClick()
                            }
                        }
                    }
                ]
            },
            {
                xtype: 'container',
                height: 40,
                padding: 1,
                margin: 5,
                layout: 'hbox',
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                items: [
                    {
                        xtype: 'textfield',
                        reference: 'cidade',
                        label: 'Cidade',
                        flex: 1,
                        margin: 0,
                        padding: 0,
                        style: {
                            paddingBottom: '0px'
                        },
                        bind: {
                            value: '{valueCidade}'
                        }
                    },
                    {
                        xtype: 'textfield',
                        reference: 'uf',
                        label: 'UF',
                        width: 50,
                        margin: 0,
                        padding: 0,
                        style: {
                            paddingBottom: '0px'
                        },
                        bind: {
                            value: '{valueEstado}'
                        }
                    }
                ]
            },
            {
                xtype: 'container',
                flex: 1,
                padding: 1,
                margin: '0 5 5 5',
                layout: 'hbox',
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                items: [
                    {
                        xtype: 'list',
                        cls: `listpesquisa list-${tema}`,
                        plugins: [{
                            xclass: 'Ext.plugin.ListPaging',
                            autoPaging: true
                        }],
                        margin: '0',
                        padding: '0',
                        itemTpl: `<table style="width: 93vw;font-weight:normal;border-bottom: solid 1px gray;">
                            <tr>
                                <td style="width:100%;font-weight:bold" colspan=5>{CEPS_ENDERECO}</td>
                            </tr>
                            <tr>
                                <td style="width:100%" colspan=5>{CEPS_CIDADE}, {CEPS_ESTADO}, {CEPS_CEP}</td>
                            </tr>
                        </table>`,
                        style: {
                            backgroundColor: 'transparent'
                        },
                        bind: {
                            store: '{main}'
                        },
                        listeners: {
                            itemtap: 'onItemClick'
                        }
                    }
                ]
            }
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})