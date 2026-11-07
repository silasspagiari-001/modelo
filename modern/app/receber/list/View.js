Ext.define('SamosAdminModern.receber.list.View', {
    extend: 'Ext.Panel',
    xtype: 'receber',

    requires: [
        'SamosAdminModern.receber.Model',
        'SamosAdminModern.receber.list.ViewController',
        'SamosAdminModern.receber.list.ViewModel'
    ],

    controller: 'receber',
    viewModel: 'receber',
    
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
                layout: 'hbox',
                height: 40,
                padding: 1,
                margin: 5,
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                items: [
                    {
                        xtype: 'datepickerfield',
                        flex: 1,
                        label: 'Data Inicial',
                        bind: {
                            value: '{valueInicio}'
                        }
                    },
                    {
                        xtype: 'datepickerfield',
                        flex: 1,
                        label: 'Data Final',
                        bind: {
                            value: '{valueFinal}'
                        }
                    },
                    {
                        xtype: 'selectfield',
                        label: 'Ordem',
                        flex: 1,
                        bind: {
                            value: '{valueOrdem}'
                        },
                        options: [
                            { value: 0, text: 'Vencimento'       },
                            { value: 1, text: 'Pagamento'        },
                            { value: 2, text: 'Emissão'          },
                            { value: 3, text: 'Pessoa'           },
                            { value: 4, text: 'Número'           },
                            { value: 5, text: 'Nosso Número'     },
                            { value: 6, text: 'Sem Nosso Número' }
                        ]
                    }
                ]
            },
            {
                xtype: 'container',
                layout: 'hbox',
                height: 40,
                padding: 1,
                margin: 5,
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                items: [
                    {
                        xtype: 'textfield',
                        reference: 'conteudo',
                        label: 'Nome ou CPF/CNPJ',
                        placeholder: 'Digite o nome ou CPF/CNPJ',
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
                                this.el.dom.onclick = () => this.up('receber').getController().onPesquisarClick()
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
                        itemTpl: `<table style="width: 93vw;font-weight:normal;border-bottom: solid 1px gray;">
                            <tr>
                                <td style="width:20%">Nome</td>
                                <td style="width:80%;font-weight:bold" colspan=5>{PESSOAS_NOME}</td>
                            </tr>
                            <tr>
                                <td style="width:20%">N. Número</td>
                                <td style="width:10%;font-weight:bold">{FINANCEIROS_NOSSONUMERO}</td>
                                <td style="width:20%">Portador</td>
                                <td style="width:50%;font-weight:bold" colspan=3>{DESCRICAO_PORTADORES}</td>
                            </tr>
                            <tr>
                                <td style="width:20%;">Emissão</td>
                                <td style="font-weight:bold;width: 30%;" colspan=2>{[ 
                                    moment(values.FINANCEIROS_EMISSAO).format('DD/MM/YYYY')
                                ]}</td>
                                <td style="width:20%;">Vencimento</td>
                                <td style="font-weight:bold;width: 30%;" colspan=2>{[ 
                                    moment(values.FINANCEIROS_VENCIMENTO).format('DD/MM/YYYY')
                                ]}</td>
                            </tr>
                            <tr>
                                <td style="width:20%">Número/Parcela</td>
                                <td style="width:30%;font-weight:bold" colspan=2>{FINANCEIROS_NUMERO}/{FINANCEIROS_PARCELA}</td>
                                <td style="width:20%;">Valor</td>
                                <td style="font-weight:bold;width: 30%;" colspan=2>{[ 
                                    Ext.util.Format.maskRenderer("#9.990,00", true, true)(values.FINANCEIROS_ABERTO)
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
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})