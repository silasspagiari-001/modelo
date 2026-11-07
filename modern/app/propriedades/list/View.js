Ext.define('SamosAdminModern.propriedades.list.View', {
    extend: 'Ext.Panel',
    xtype: 'propriedades',

    requires: [
        'SamosAdminModern.propriedades.Model',
        'SamosAdminModern.propriedades.list.ViewController',
        'SamosAdminModern.propriedades.list.ViewModel',
        'SamosAdminModern.propriedades.form.View'
    ],

    controller: 'propriedades',
    viewModel: 'propriedades',
    
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
                        placeholder: 'Nome, CPF, CNPJ, +Celular, *Sobrenome',
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
                                this.el.dom.onclick = () => this.up('pessoas').getController().onPesquisarClick()
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
                                <td style="width:20%">Cep/Cidade</td>
                                <td style="width:80%;font-weight:bold" colspan=5>{[ 
                                    Ext.util.Format.maskRenderer("99.999-999")(values.PESSOAS_CEP)
                                ]} {CIDADES_NOME} {CIDADES_ESTADO}</td>
                            </tr>
                            <tr>
                                <td style="width:20%">{[values.PESSOAS_CPFCNPJ.length == 11 ? "CPF" : "CNPJ"]}</td>
                                <td style="width:80%;font-weight:bold">{[ 
                                    values.PESSOAS_CPFCNPJ.length == 11 ? 
                                    Ext.util.Format.maskRenderer("999.999.999-99")(values.PESSOAS_CPFCNPJ) : 
                                    Ext.util.Format.maskRenderer("99.999.999/9999-99")(values.PESSOAS_CPFCNPJ)
                                ]}</td>
                            </tr>
                            <tr>
                                <td style="width:20%">Fone</td>
                                <td style="width:40%;font-weight:bold">{[ 
                                    (values.PESSOAS_CELULAR || values.PESSOAS_TELEFONE || '').replace(/[^0-9]/g, '').length == 11 ?
                                    Ext.util.Format.maskRenderer("(99) 99999-9999")((values.PESSOAS_CELULAR || values.PESSOAS_TELEFONE || '').replace(/[^0-9]/g, '')) :
                                    (values.PESSOAS_CELULAR || values.PESSOAS_TELEFONE || '').replace(/[^0-9]/g, '').length == 10 ?
                                    Ext.util.Format.maskRenderer("(99) 9999-9999")((values.PESSOAS_CELULAR || values.PESSOAS_TELEFONE || '').replace(/[^0-9]/g, '')) :
                                    (values.PESSOAS_CELULAR || values.PESSOAS_TELEFONE || '').replace(/[^0-9]/g, '').length == 9 ?
                                    Ext.util.Format.maskRenderer("99999-9999")((values.PESSOAS_CELULAR || values.PESSOAS_TELEFONE || '').replace(/[^0-9]/g, '')) :
                                    (values.PESSOAS_CELULAR || values.PESSOAS_TELEFONE || '').replace(/[^0-9]/g, '').length == 8 ?
                                    Ext.util.Format.maskRenderer("9999-9999")((values.PESSOAS_CELULAR || values.PESSOAS_TELEFONE || '').replace(/[^0-9]/g, '')) :
                                    (values.PESSOAS_CELULAR || values.PESSOAS_TELEFONE || '').replace(/[^0-9]/g, '')
                                ]}</td>
                                <td style="width:20%">Código</td>
                                <td style="width:20%;font-weight:bold">{PESSOAS_ID}</td>
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