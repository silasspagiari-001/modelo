Ext.define('SamosAdminModern.notificacao.form.View', {
    extend: 'Ext.Panel',
    xtype: 'notificacaoform',

    requires: [
        'SamosAdminModern.notificacao.form.ViewController',
        'SamosAdminModern.notificacao.form.ViewModel'
    ],

    controller: 'notificacaoform',
    viewModel: 'notificacaoform',
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    listeners: {
        show: 'showButtons'
    },

    scrollable: true,

    style: {
        backgroundColor: 'transparent'
    },

    cls: 'formcls',

    initialize: function() {
        const tema = configs.getTema();
        
        this.callParent(arguments);

        this.setItems([
            {
                xtype: 'container',
                padding: 5,
                margin: 5,
                layout: 'hbox',
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                items: [
                    {
                        xtype: 'button',
                        height: 35,
                        text: 'Marcar',
                        cls: `back-color-${tema}`,
                        style: {
                            textAlign: 'center',
                            color: 'black',
                            borderRadius: '20px',
                            fontSize: '12px'
                        },
                        handler: 'onMarcarClick'
                    },
                    {
                        xtype: 'datepickerfield',
                        width: 115,
                        label: 'Data',
                        bind: {
                            value: '{dataAvisar}'
                        }
                    },
                    {
                        xtype: 'selectfield',
                        label: 'Horário',
                        width: 75,
                        bind: {
                            value: '{horaAvisar}'
                        },
                        options: SamosUtils.Info.getHorarios().map(horario => {
                            return {
                                value: horario,
                                text : horario
                            }
                        })
                    },
                    {
                        xtype: 'button',
                        height: 35,
                        text: 'Reagendar',
                        cls: `back-color-${tema}`,
                        style: {
                            textAlign: 'center',
                            color: 'black',
                            borderRadius: '20px',
                            fontSize: '12px'
                        },
                        handler: 'onReagendarClick'
                    }
                ]
            },
            {
                xtype: 'container',
                padding: 5,
                margin: '0 5 5 5',
                layout: 'hbox',
                style: {
                    border: 'solid 1px black',
                    borderRadius: '5px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'blue'
                },
                bind: {
                    html: '{model.NOTIFICACAO_NOME}'
                }
            },
            {
                xtype: 'container',
                padding: 5,
                margin: '0 5 5 5',
                layout: 'hbox',
                flex: 1,
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px',
                    fontSize: '18px'
                },
                bind: {
                    html: '{model.NOTIFICACAO_MENSAGEM}'
                }
            }
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})