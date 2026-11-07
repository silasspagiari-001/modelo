Ext.define('SamosAdminModern.pessoas.compras.View', {
    extend: 'Ext.Panel',
    xtype: 'pessoascompras',

    requires: [
        'SamosAdminModern.pessoas.Model',
        'SamosAdminModern.pessoas.compras.ViewController',
        'SamosAdminModern.pessoas.compras.ViewModel'
    ],

    controller: 'pessoascompras',
    viewModel: 'pessoascompras',
    
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
                        itemTpl: `<table style="width: 93vw;font-weight:normal;border-bottom: solid 1px gray;font-size: 10px;">
                            <tr>
                                <td style="width:100%;font-weight:bold;font-size: 14px;" colspan=8>{PRODUTOS_NOME}</td>
                            </tr>
                            <tr>
                                <td style="width:10%">Docto</td>
                                <td style="width:40%;" colspan=5>{MOVIMENTOS_NUMERO}/{MOVIMENTOS_SERIE}</td>
                                <td style="width:10%">Emissão</td>
                                <td style="width:40%;" colspan=5>{[
                                    moment(values.MOVIMENTOS_EMISSAO, 'YYYY-MM-DD').format('DD/MM/YYYY')
                                ]}</td>
                            </tr>
                            <tr>
                                <td style="width:15%">Código</td>
                                <td style="width:10%;">{MOVIMENTOSITENS_ID_PRODUTOS}</td>
                                <td style="width:10%">Qtde</td>
                                <td style="width:15%;">{MOVIMENTOSITENS_QUANTIDADE} {PRODUTOS_UNIDADE}</td>
                                <td style="width:10%">Preço</td>
                                <td style="width:15%;">{[ 
                                    Ext.util.Format.currency(values.MOVIMENTOSITENS_PRECO)
                                ]}</td>
                                <td style="width:10%;text-align: right;">Total</td>
                                <td style="width:15%;font-weight:bold;text-align: right;">{[ 
                                    Ext.util.Format.currency(values.MOVIMENTOSITENS_TOTAL)
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
                padding: 12,
                layout: 'hbox',
                items: {
                    xtype: 'button',
                    height: 35,
                    flex: 1,
                    bind: {
                        text: 'Total: {total}'
                    },
                    cls: `back-color-${tema}`,
                    style: {
                        textAlign: 'center',
                        color: 'yellow',
                        borderRadius: '20px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }
                }
            }
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})