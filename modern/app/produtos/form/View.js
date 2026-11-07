Ext.define('SamosAdminModern.produtos.form.View', {
    extend: 'Ext.Panel',
    xtype: 'produtosform',

    requires: [
        'SamosAdminModern.produtos.form.ViewController',
        'SamosAdminModern.produtos.form.ViewModel'
    ],

    controller: 'produtosform',
    viewModel: 'produtosform',
    
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

    cls: 'produtosform-cls',

    initialize: function() {
        const tema = configs.getTema();
        
        this.callParent(arguments);

        this.setItems([
            {
                xtype: 'container',
                padding: 1,
                margin: '5 5 0 5',
                padding: '5',
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                bind: {
                    hidden: '{hidePromocao}'
                },
                items: [
                    {
                        xtype: 'container',
                        margin: '0 0 10 0',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Nome da promoção',
                                readOnly: true,
                                bind: {
                                    value: '{promocao.PROMOCOES_NOME}'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        margin: '0 0 10 0',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'datepickerfield',
                                cls: 'input-color-red',
                                flex: 1,
                                label: 'Até',
                                readOnly: true,
                                triggers: null,
                                bind: {
                                    value: '{promocao.PROMOCOES_VALIDADE}'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
                                label: 'Valor à vista',
                                cls: 'input-color-blue',
                                reference: 'partida',
                                flex: 1,
                                bind: {
                                    value: '{valorPromocao}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
                                label: 'Valor no Cartão 10x',
                                cls: 'input-color-blue',
                                reference: 'cartao',
                                flex: 1,
                                bind: {
                                    value: '{valorCartao}',
                                    readOnly: '{readOnly}'
                                }
                            }

                        ]
                    }
                ]
            },
            {
                xtype: 'container',
                flex: 1,
                padding: 1,
                margin: '5',
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
                                <td style="width:100%;font-weight:bold" colspan=4>{EMPRESAS_FANTASIA}</td>
                            </tr>
                            <tr>
                                <td style="width:10%">Comprado</td>
                                <td style="width:40%;font-weight:bold">{SALDOS_COMPRADO}</td>
                                <td style="width:10%">Pendente</td>
                                <td style="width:40%;font-weight:bold">{SALDOS_RESERVADO}</td>
                                <td style="width:10%">Disponível</td>
                                <td style="width:40%;font-weight:bold">{SALDOS_DISPONIVEL}</td>
                            </tr>
                        </table>`,
                        style: {
                            backgroundColor: 'transparent'
                        },
                        bind: {
                            store: '{main}'
                        }
                    }
                ]
            },
            {
                xtype: 'container',
                layout: 'hbox',
                hidden: configs.getClientName() != 'prudenmoveis',
                items: [
                    {
                        xtype: 'button',
                        text: 'Exibir Fotos',
                        cls: 'btn-fotos',
                        handler: 'onFotosClick',
                        flex: 1,
                        bind: {
                            
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