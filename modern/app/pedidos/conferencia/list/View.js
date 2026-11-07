Ext.define('SamosAdminModern.pedidos.conferencia.list.View', {
    extend: 'Ext.Panel',
    xtype: 'pedidosconferencia',

    requires: [
        'SamosAdminModern.pedidos.ModelItens',
        'SamosAdminModern.pedidos.conferencia.list.ViewController',
        'SamosAdminModern.pedidos.conferencia.list.ViewModel'
    ],

    controller: 'pedidosconferencia',
    viewModel: 'pedidosconferencia',
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    style: {
        backgroundColor: 'transparent'
    },

    cls: 'pedidosconferencia-cls',

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
                items: [
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                reference: 'conteudo',
                                label: 'Código de Barras',
                                placeholder: 'Digite o código de barras',
                                flex: 1,
                                margin: 0,
                                padding: 0,
                                style: {
                                    paddingBottom: '0px'
                                },
                                bind: {
                                    value: '{valueBarras}'
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
                                        this.el.dom.onclick = () => this.up('pedidosconferencia').getController().onBuscarClick()
                                    }
                                }
                            },
                            {
                                xtype: 'button',
                                height: 35,
                                text: 'Liberar',
                                margin: '0 5 0 0',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: 'onLiberarClick',
                                bind: {
                                    hidden: '{hideLiberar}'
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
                                <td style="width: 50px;">Qtde</td>
                                <td style="font-weight:bold;width: 50px;text-align:right;margin-right:8px;" colspan=5>{MOVIMENTOSITENS_QUANTIDADE}</td>
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
            }
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})