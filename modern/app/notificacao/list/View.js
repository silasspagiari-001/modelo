Ext.define('SamosAdminModern.notificacao.list.View', {
    extend: 'Ext.Panel',
    xtype: 'notificacao',

    requires: [
        'SamosAdminModern.notificacao.Model',
        'SamosAdminModern.notificacao.list.ViewController',
        'SamosAdminModern.notificacao.list.ViewModel',
        'SamosAdminModern.notificacao.form.View'
    ],

    controller: 'notificacao',
    viewModel: 'notificacao',
    
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
                height: 85,
                padding: 5,
                margin: 5,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
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
                                label: 'Opção',
                                flex: 1,
                                bind: {
                                    value: '{valueStatus}'
                                },
                                options: [
                                    { value: 6, text: 'Não Lida'  },
                                    { value: 1, text: 'Lida'      },
                                    { value: 2, text: 'Reagendada'},
                                    { value: 3, text: 'Enviadas'  },
                                    { value: 4, text: 'Recebidas' },
                                    { value: 5, text: 'Todas'     }
                                ]
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                reference: 'conteudo',
                                label: 'Título',
                                placeholder: 'Digite a mensagem',
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
                                        this.el.dom.onclick = () => this.up('notificacao').getController().onPesquisarClick()
                                    }
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
                            values.NOTIFICACAO_STATUS === 'N' ? "color:blue"   : 
                            values.NOTIFICACAO_STATUS === 'L' ? "color:black" :
                                                                "color:purple" 
                        ]}">
                            <tr>
                                <td style="width:100%;font-weight:bold;font-size:16px;" colspan=6>{NOTIFICACAO_NOME}</td>
                            </tr>
                            <tr>
                                <td style="width:20%">Origem</td>
                                <td style="width:80%;font-weight:bold" colspan=5>{USUARIOS_NOMEORIGEM}</td>
                            </tr>
                            <tr>
                                <td >Data</td>
                                <td style="font-weight:bold">{[
                                    moment(values.NOTIFICACAO_DATAAVISAR, 'YYYY-MM-DD').format('DD/MM/YYYY')
                                ]}</td>
                                <td >Hora</td>
                                <td style="font-weight:bold">{NOTIFICACAO_HORAAVISAR}</td>
                                <td >Lida</td>
                                <td style="font-weight:bold">{[
                                    moment(values.NOTIFICACAO_DATALEITURA, 'YYYY-MM-DD').isAfter('1900-01-01') ? 
                                    moment(values.NOTIFICACAO_DATALEITURA, 'YYYY-MM-DD').format('DD/MM/YYYY') : 
                                    ''
                                ]}</td>
                                <td >Hora</td>
                                <td style="font-weight:bold">{NOTIFICACAO_HORALEITURA}</td>
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