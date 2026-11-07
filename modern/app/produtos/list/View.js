Ext.define('SamosAdminModern.produtos.list.View', {
    extend: 'Ext.Panel',
    xtype: 'produtos',

    requires: [
        'SamosAdminModern.produtos.Model',
        'SamosAdminModern.produtos.list.ViewController',
        'SamosAdminModern.produtos.list.ViewModel',
        'SamosAdminModern.produtos.form.View'
    ],

    controller: 'produtos',
    viewModel: 'produtos',
    
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

        const labelMinimo   = configs.getClientName() == 'stilomoveis' ? configs.getProdutos().labelMinimo : 'Mínimo';
        const labelPromocao = configs.getClientName() == 'stilomoveis' ? configs.getProdutos().labelPrazo : '';
        const labelUnidade = configs.getClientName() == 'stilomoveis' ? '' : 'Uni'
        const campoUnidade = configs.getClientName() == 'stilomoveis' ? '' : 'UNIDADE';

        const labelMontagem = configs.getClientName() == 'stilomoveis' ? '' : 'Montagem'
        const campoMontagem = configs.getClientName() == 'stilomoveis' ? '' : '{[Ext.util.Format.currency(values.PRECOMONTAGEM)]}';
        const campoPromocao = configs.getClientName() == 'stilomoveis' ? '{[Ext.util.Format.currency(values.PRAZO)]}' : '';        
        
        const labelCores = configs.getClientName() == 'stilomoveis' ? configs.getProdutos().labelAplicacao : configs.getProdutos().labelMarca,
              campoCores = configs.getClientName() == 'stilomoveis' ? 'APLICACAO' : 'MARCA';
        
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
                                this.el.dom.onclick = () => this.up('produtos').getController().onPesquisarClick()
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
                                <td style="width:100%;font-weight:bold" colspan=4>{NOME}</td>
                            </tr>
                            <tr>
                                <td style="width:10%"> ${labelCores} </td>
                                <td style="width:40%;font-weight:bold;{[
                                    values.DISPONIVEL <= 0 ? 
                                        configs.getProdutos().coresSaldos ? 
                                        configs.getProdutos().coresSaldos.zerado : 
                                        "color: red;" :
                                    values.DISPONIVEL > 0 && values.DISPONIVEL <= 5 ? 
                                        configs.getProdutos().coresSaldos ? 
                                        configs.getProdutos().coresSaldos.baixo : 
                                        "color: yellow;" :
                                    configs.getProdutos().coresSaldos ? 
                                        configs.getProdutos().coresSaldos.normal : 
                                        "color: green;"
                                ]}">{${campoCores}}</td>
                                <td style="width:10%">${labelUnidade}</td>
                                <td style="width:40%;font-weight:bold">${campoUnidade}</td>
                            </tr>
                            <tr>
                                <td style="width:15%">${labelMontagem}</td>
                                <td style="width:35%;font-weight:bold">${campoMontagem}</td>
                                <td style="width:15%">Saldo</td>
                                <td style="width:35%;font-weight:bold" align="right">{DISPONIVEL}</td>
                            </tr>
                            <tr>
                                <td style="width:15%">Código</td>
                                <td style="width:35%;font-weight:bold">{[
                                    values.STATUS == 'L' ? '(*) ' + values.CODIGO : values.CODIGO
                                ]}</td>
                                <td style="width:30%">{[configs.getProdutos().labelPreco]}</td>
                                <td style="width:20%;font-weight:bold" align="right">{[ 
                                    Ext.util.Format.currency(values.PRECO)
                                ]}</td>
                            </tr>
                            <tr>
                                <td style="width:15%"></td>
                                <td style="width:35%;font-weight:bold"></td>
                                <td style="width:30%">{[configs.getProdutos().grid['SALDOS_PRECOMINIMO'] ? '${labelMinimo}' : '']}</td>
                                <td style="width:20%;font-weight:bold" align="right">{[ 
                                    configs.getProdutos().grid['SALDOS_PRECOMINIMO'] ? Ext.util.Format.currency(values.PRECOMINIMO) : ''
                                ]}</td>
                            </tr>
                            <tr>
                                <td style="width:15%"></td>
                                <td style="width:35%;font-weight:bold"></td>
                                <td style="width:30%">${labelPromocao}</td>
                                <td style="width:20%;font-weight:bold" align="right">${campoPromocao}</td>
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