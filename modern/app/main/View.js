Ext.define('SamosAdminModern.main.View', {
    extend: 'Ext.Panel',
    xtype: 'main',

    requires: [
        'SamosAdminModern.main.ViewModel',
        'SamosAdminModern.inicio.View',
        'SamosAdminModern.login.View',
        'SamosAdminModern.menu.View',
        'SamosAdminModern.pessoas.list.View',
        'SamosAdminModern.usuarios.list.View',
        'SamosAdminModern.produtos.list.View',
        'SamosAdminModern.receber.list.View',
        'SamosAdminModern.receber.form.View',
        'SamosAdminModern.orcamentos.list.View',
        'SamosAdminModern.orcamentos.produtos.list.View',
        'SamosAdminModern.orcamentos.produtos.search.View',
        'SamosAdminModern.orcamentos.pessoas.search.View',
        'SamosAdminModern.orcamentos.pagamentos.View',
        'SamosAdminModern.pedidos.list.View',
        'SamosAdminModern.pedidos.produtos.list.View',
        'SamosAdminModern.pedidos.conferencia.list.View',
        'SamosAdminModern.pedidos.pagamentos.View',
        'SamosAdminModern.notaeletronica.list.View',
        'SamosAdminModern.notaeletronica.produtos.list.View',
        'SamosAdminModern.ceps.list.View',
        'SamosAdminModern.notificacao.list.View'
    ],

    fullscreen: true,
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    viewModel: 'main',

    initialize: function() {
        const tema = configs.getTema();
        
        this.callParent(arguments);

        this.setItems([
            {
                xtype: 'container',
                height: 45,
                layout: 'hbox',
                cls: `back-color-${tema}`,
                style: {
                    border: 'solid 1px'
                },
                items: [
                    {
                        xtype: 'image',
                        reference: 'voltar',
                        src: 'resources/images/buttons/voltar.png',
                        margin: 5,
                        width: 35,
                        height: 35,
                        bind: {
                            hidden: '{hideVoltar}'
                        },
                        listeners: {
                            initialize: function() {
                                this.el.dom.onclick = () => {
                                    this.up('main').down('panel').getActiveItem().getController().onVoltarClick();
                                }
                            }
                        }
                    },
                    {
                        xtype: 'container',
                        reference: 'title',
                        html: 'Inicialização',
                        flex: 1,
                        height: 45,
                        padding: 12,
                        style: {
                            textAlign: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }
                    },
                    {
                        xtype: 'image',
                        reference: 'alterar',
                        src: 'resources/images/buttons/alterar.png',
                        margin: 5,
                        width: 35,
                        height: 35,
                        bind: {
                            hidden: '{hideAlterar}'
                        },
                        listeners: {
                            initialize: function() {
                                this.el.dom.onclick = () => {
                                    this.up('main').down('panel').getActiveItem().getController().onAlterarClick();
                                }
                            }
                        }
                    },
                    {
                        xtype: 'image',
                        reference: 'gravar',
                        src: 'resources/images/buttons/gravar.png',
                        margin: 5,
                        width: 35,
                        height: 35,
                        bind: {
                            hidden: '{hideGravar}'
                        },
                        listeners: {
                            initialize: function() {
                                this.el.dom.onclick = () => {
                                    this.up('main').down('panel').getActiveItem().getController().onGravarClick();
                                }
                            }
                        }
                    },
                    {
                        xtype: 'image',
                        reference: 'excluir',
                        src: 'resources/images/buttons/excluir.png',
                        margin: 5,
                        width: 35,
                        height: 35,
                        bind: {
                            hidden: '{hideExcluir}'
                        },
                        listeners: {
                            initialize: function() {
                                this.el.dom.onclick = () => {
                                    this.up('main').down('panel').getActiveItem().getController().onExcluirClick();
                                }
                            }
                        }
                    },
                    {
                        xtype: 'image',
                        reference: 'novo',
                        src: 'resources/images/buttons/novo.png',
                        margin: 5,
                        width: 35,
                        height: 35,
                        bind: {
                            hidden: '{hideNovo}'
                        },
                        listeners: {
                            initialize: function() {
                                this.el.dom.onclick = () => {
                                    this.up('main').down('panel').getActiveItem().getController().onNovoClick();
                                }
                            }
                        }
                    }
                ]
            },
            {
                xtype: 'image',
                reference: 'logo',
                margin: '20 20 5 20',
                height: 100,
                src: `resources/images/login/${tema}.png`,
                style: {
                    textAlign: 'center'
                }
            },
            {
                xtype: 'panel',
                reference: 'slidepanel',
                flex: 1,
                style: {
                    backgroundColor: 'transparent'
                },
                layout: {
                    type: 'card',
                    animation: 'slide'
                },
                items: [
                    {
                        xtype: 'inicio'
                    },
                    {
                        xtype: 'login'
                    },
                    {
                        xtype: 'menulist'
                    },
                    {
                        xtype: 'pessoas'
                    },
                    {
                        xtype: 'pessoasform'
                    },
                    {
                        xtype: 'pessoascompras'
                    },
                    {
                        xtype: 'usuarios'
                    },
                    {
                        xtype: 'usuariosform'
                    },
                    {
                        xtype: 'produtos'
                    },
                    {
                        xtype: 'produtosform'
                    },
                    {
                        xtype: 'receber'
                    },
                    {
                        xtype: 'receberform'
                    },
                    {
                        xtype: 'orcamentos'
                    },
                    {
                        xtype: 'orcamentosform'
                    },
                    {
                        xtype: 'orcamentospagamentos'
                    },
                    {
                        xtype: 'orcamentosprodutos'
                    },
                    {
                        xtype: 'orcamentosprodutossearch'
                    },
                    {
                        xtype: 'orcamentospessoassearch'
                    },
                    {
                        xtype: 'pedidos'
                    },
                    {
                        xtype: 'pedidosform'
                    },
                    {
                        xtype: 'pedidospagamentos'
                    },
                    {
                        xtype: 'pedidosconferencia'
                    },
                    {
                        xtype: 'pedidosprodutos'
                    },
                    {
                        xtype: 'notaeletronica'
                    },
                    {
                        xtype: 'notaeletronicaform'
                    },
                    {
                        xtype: 'notaeletronicaprodutos'
                    },
                    {
                        xtype: 'notificacao'
                    },
                    {
                        xtype: 'notificacaoform'
                    },
                    {
                        xtype: 'ceps'
                    }
                ]
            }
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundImage="url('resources/images/back/fundo-" +  tema + ".png')";
            this.el.dom.children[0].children[0].style.backgroundSize="cover";
            this.el.dom.children[0].children[0].style.backgroundRepeat="repeat";
            this.el.dom.children[0].children[0].children[2].children[0].children[0].style.backgroundColor='transparent'  
        }, 100);
    }
})