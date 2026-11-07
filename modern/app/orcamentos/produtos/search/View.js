Ext.define('SamosAdminModern.orcamentos.produtos.search.View', {
    extend: 'Ext.Panel',
    xtype: 'orcamentosprodutossearch',

    requires: [
        'SamosAdminModern.produtos.Model',
        'SamosAdminModern.orcamentos.produtos.search.ViewController',
        'SamosAdminModern.orcamentos.produtos.search.ViewModel'
    ],

    controller: 'orcamentosprodutossearch',
    viewModel: 'orcamentosprodutossearch',
    
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
                        label: 'Conteúdo',
                        placeholder: 'Descrição, Código, BarCode',
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
                                this.el.dom.onclick = () => this.up('orcamentosprodutossearch').getController().onPesquisarClick()
                            }
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
                        itemTpl: `<table style="width: 93vw;font-weight:normal;border-bottom: solid 1px gray;{[
                            values.PROMOCOES && values.PROMOCOES.length > 0 ? "color:blue;" : "color:black;"
                        ]}">
                            <tr>
                                <td style="width:100%;font-weight:bold" colspan=4>{PRODUTOS_NOME}</td>
                            </tr>
                            <tr>
                                <td style="width:10%">{[configs.getProdutos().labelMarca]}</td>
                                <td style="width:40%;font-weight:bold;{[
                                    values.SALDOS_DISPONIVEL <= 0 ? 
                                        configs.getProdutos().coresSaldos ? 
                                        configs.getProdutos().coresSaldos.zerado : 
                                        "color: red;" :
                                    values.SALDOS_DISPONIVEL > 0 && values.SALDOS_DISPONIVEL <= 5 ? 
                                        configs.getProdutos().coresSaldos ? 
                                        configs.getProdutos().coresSaldos.baixo : 
                                        "color: yellow;" :
                                    configs.getProdutos().coresSaldos ? 
                                        configs.getProdutos().coresSaldos.normal : 
                                        "color: green;"
                                ]}">{PRODUTOS_MARCA}</td>
                                <td style="width:10%">Uni</td>
                                <td style="width:40%;font-weight:bold">{PRODUTOS_UNIDADE}</td>
                            </tr>
                            <tr>
                                <td style="width:10%">Montagem</td>
                                <td style="width:40%;font-weight:bold">{[ 
                                    Ext.util.Format.currency(values.MONTAGENS_VALOR)
                                ]}</td>
                                <td style="width:10%">Saldo</td>
                                <td style="width:40%;font-weight:bold">{SALDOS_DISPONIVEL}</td>
                            </tr>
                            <tr>
                                <td style="width:10%">Código</td>
                                <td style="width:40%;font-weight:bold">{[
                                    values.PRODUTOS_STATUS == 'L' ? '(*) ' + values.PRODUTOS_ID : values.PRODUTOS_ID
                                ]}</td>
                                <td style="width:10%">{[configs.getProdutos().labelPreco]}</td>
                                <td style="width:40%;font-weight:bold">{[ 
                                    Ext.util.Format.currency(values.SALDOS_PRECO)
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
            }
        ]);
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})