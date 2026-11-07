Ext.define('SamosAdminModern.orcamentos.produtos.list.View', {
    extend: 'Ext.Panel',
    xtype: 'orcamentosprodutos',

    requires: [
        'SamosAdminModern.orcamentos.ModelItens',
        'SamosAdminModern.orcamentos.produtos.list.ViewController',
        'SamosAdminModern.orcamentos.produtos.list.ViewModel',
        'SamosAdminModern.orcamentos.produtos.search.View'
    ],

    controller: 'orcamentosprodutos',
    viewModel: 'orcamentosprodutos',
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    style: {
        backgroundColor: 'transparent'
    },

    cls: 'orcamentosprodutosform-cls',

    initialize: function() {
        const tema = configs.getTema();
        
        this.callParent(arguments);

        this.setItems([
            {
                xtype: 'container',
                padding: 1,
                margin: '5 5 0 5',
                padding: '5',
                cls: 'produto-detalhe',
                bind: {
                    hidden: '{hideForm}'
                },
                items: [
                    {
                        xtype: 'container',
                        margin: '0 0 10 0',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Código',
                                width: 80,
                                readOnly: true,
                                bind: {
                                    value: '{produto.MOVIMENTOSITENS_ID_PRODUTOS}'
                                }
                            },
                            {
                                xtype: 'image',
                                reference: 'voltar',
                                src: 'resources/images/buttons/pesquisar.png',
                                margin: '8 5 0 0',
                                width: 18,
                                height: 18,
                                bind: {
                                    hidden: '{readOnly}'
                                },
                                listeners: {
                                    initialize: function() {
                                        this.el.dom.onclick = () => {
                                            this.up('main').down('panel').getActiveItem().getController().onPesquisarClick();
                                        }
                                    }
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Unidade',
                                flex: 1,
                                readOnly: true,
                                bind: {
                                    value: '{produto.PRODUTOS_UNIDADE}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Cor',
                                flex: 1,
                                readOnly: true,
                                bind: {
                                    value: '{produto.PRODUTOS_MARCA}'
                                }
                            },
                            {
                                xtype: 'image',
                                reference: 'recolher',
                                src: 'resources/images/buttons/recolher.png',
                                margin: '8 5 0 0',
                                width: 18,
                                height: 18,
                                listeners: {
                                    initialize: function() {
                                        this.el.dom.onclick = () => {
                                            this.up('main').down('panel').getActiveItem().getController().onRecolherClick();
                                        }
                                    }
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
                                xtype: 'textfield',
                                label: 'Descrição',
                                flex: 1,
                                readOnly: true,
                                bind: {
                                    value: '{produto.PRODUTOS_NOME}'
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
                                xtype: 'image',
                                reference: 'voltar',
                                src: 'resources/images/buttons/menos.png',
                                margin: '8 5 0 0',
                                width: 18,
                                height: 18,
                                bind: {
                                    hidden: '{readOnly}'
                                },
                                listeners: {
                                    initialize: function() {
                                        this.el.dom.onclick = () => {
                                            this.up('main').down('panel').getActiveItem().getController().onMenosClick();
                                        }
                                    }
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Qtde',
                                width: 80,
                                cls: 'input-text-align-center',
                                bind: {
                                    value: '{produto.MOVIMENTOSITENS_QUANTIDADE}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'image',
                                reference: 'voltar',
                                src: 'resources/images/buttons/mais.png',
                                margin: '8 5 0 0',
                                width: 18,
                                height: 18,
                                bind: {
                                    hidden: '{readOnly}'
                                },
                                listeners: {
                                    initialize: function() {
                                        this.el.dom.onclick = () => {
                                            this.up('main').down('panel').getActiveItem().getController().onMaisClick();
                                        }
                                    }
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Preço',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 5',
                                flex: 1,
                                readOnly: true,
                                bind: {
                                    value: '{valorPreco}'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
                                label: '% Desconto',
                                reference: 'percentual',
                                cls: 'input-text-align-right',
                                flex: 1,
                                listeners: {
                                    keyup: 'calcularProduto'
                                },
                                bind: {
                                    value: '{valorPercentual}',
                                    readOnly: '{readOnly}'
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
                                xtype: 'samoswidgetsmodern-textmoney',
                                label: 'R$ Desconto',
                                flex: 1,
                                margin: '0 5 0 5',
                                reference: 'desconto',
                                cls: 'input-text-align-right',
                                listeners: {
                                    keyup: 'calcularProduto'
                                },
                                bind: {
                                    value: '{valorDesconto}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'R$ Preço Líquido',
                                flex: 1,
                                margin: '0 5 0 5',
                                readOnly: true,
                                cls: 'input-text-align-right',
                                bind: {
                                    value: '{valorPrecoLiquido}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'R$ Total Líquido',
                                flex: 1,
                                cls: 'input-text-align-right',
                                readOnly: true,
                                bind: {
                                    value: '{valorTotalLiquido}'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        layout: {
                            type: 'hbox',
                            align: 'center'
                        },
                        bind: {
                            hidden: '{readOnly}'
                        },
                        items: [
                            {
                                xtype: 'container',
                                flex: 1
                            },
                            {
                                xtype: 'button',
                                height: 35,
                                text: 'Cancelar',
                                margin: '0 5 0 0',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: 'onCancelarClick'
                            },
                            {
                                xtype: 'button',
                                height: 35,
                                text: 'Confirmar',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: 'onConfirmarClick'
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
                                <td style="width:100%;font-weight:bold;font-size:16px;color:blue;" colspan=4>{PRODUTOS_NOME}</td>
                            </tr>
                            <tr
                                style="
                                    display: flex;
                                    flex-direction: row;
                                    flex-wrap: nowrap;
                                    justify-content: flex-start;
                                    align-items: center;
                                    align-content: center;
                                    width: 93vw;
                                "
                            >
                                <td style="width: 50px;">Código</td>
                                <td style="font-weight:bold;width: 50px;text-align:right;margin-right:8px;" colspan=5>{MOVIMENTOSITENS_ID_PRODUTOS}</td>
                                <td style="width: 50px;">Uni</td>
                                <td style="font-weight:bold;width: 50px;text-align:right;margin-right:8px;" colspan=5>{PRODUTOS_UNIDADE}</td>
                                <td style="width: 50px;">Cor</td>
                                <td style="font-weight:bold;flex-grow: 1;text-align:right" colspan=5>{PRODUTOS_MARCA}</td>
                            </tr>
                            <tr
                                style="
                                    display: flex;
                                    flex-direction: row;
                                    flex-wrap: nowrap;
                                    justify-content: flex-start;
                                    align-items: center;
                                    align-content: center;
                                    width: 93vw;
                                "
                            >
                                <td style="width: 50px;">Qtde</td>
                                <td style="font-weight:bold;width: 50px;text-align:right;margin-right:8px;" colspan=5>{MOVIMENTOSITENS_QUANTIDADE}</td>
                                <td style="width: 50px;">Preço</td>
                                <td style="font-weight:bold;width: 50px;text-align:right;margin-right:8px;" colspan=5>{[ 
                                    Ext.util.Format.currency(values.MOVIMENTOSITENS_PRECO)
                                ]}</td>
                                <td style="width: 50px;">%Dsc</td>
                                <td style="font-weight:bold;flex-grow: 1;text-align:right" colspan=5>{[ 
                                    Ext.util.Format.currency(values.MOVIMENTOSITENS_PERCENTUAL)
                                ]}</td>
                            </tr>
                            <tr
                                style="
                                    display: flex;
                                    flex-direction: row;
                                    flex-wrap: nowrap;
                                    justify-content: flex-start;
                                    align-items: center;
                                    align-content: center;
                                    width: 93vw;
                                "
                            >
                                <td style="width: 50px;">$Dsc</td>
                                <td style="font-weight:bold;width: 50px;text-align:right;margin-right:8px;" colspan=5>{[ 
                                    Ext.util.Format.currency(values.MOVIMENTOSITENS_DESCONTOS)
                                ]}</td>
                                <td style="width: 50px;">Liquido</td>
                                <td style="font-weight:bold;width: 50px;text-align:right;margin-right:8px;" colspan=5>{[ 
                                    Ext.util.Format.currency(values.VALOR_LIQUIDO)
                                ]}</td>
                                <td style="width: 50px;">Total</td>
                                <td style="font-weight:bold;flex-grow: 1;text-align:right;color:green;" colspan=5>{[ 
                                    Ext.util.Format.currency(values.TOTAL_LIQUIDO)
                                ]}</td>
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
            },
            {
                xtype: 'container',
                padding: 1,
                margin: '0 5 5 5',
                padding: '5',
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                items: [
                    {
                        xtype: 'container',
                        margin: '0 0 10 0',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'R$ Descontos',
                                flex: 1,
                                margin: '0 5 0 5',
                                cls: 'input-text-align-right',
                                readOnly: true,
                                bind: {
                                    value: '{totalDesconto}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'R$ Produtos',
                                flex: 1,
                                margin: '0 5 0 5',
                                readOnly: true,
                                cls: 'input-text-align-right',
                                bind: {
                                    value: '{totalProdutos}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'R$ Total Líquido',
                                flex: 1,
                                cls: 'input-text-align-right',
                                readOnly: true,
                                bind: {
                                    value: '{totalLiquido}'
                                }
                            }
                        ]
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