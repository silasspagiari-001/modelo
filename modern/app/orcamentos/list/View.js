Ext.define('SamosAdminModern.orcamentos.list.View', {
    extend: 'Ext.Panel',
    xtype: 'orcamentos',

    requires: [
        'SamosAdminModern.orcamentos.Model',
        'SamosAdminModern.orcamentos.list.ViewController',
        'SamosAdminModern.orcamentos.list.ViewModel',
        'SamosAdminModern.orcamentos.form.View'
    ],

    controller: 'orcamentos',
    viewModel: 'orcamentos',
    
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
                                    { value: 1, text: 'NãoFaturado' },
                                    { value: 2, text: 'Faturado'     },
                                    { value: 3, text: 'Cancelado'    },
                                    { value: 6, text: 'Todos'        }
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
                                label: 'Nome',
                                placeholder: 'Digite o nome',
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
                                        this.el.dom.onclick = () => this.up('orcamentos').getController().onPesquisarClick()
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
                        itemTpl: `<table 
                            style="width: 93vw;font-weight:normal;border-bottom: solid 1px gray;"
                            class="{[
                                (
                                    values.DOCUMENTOS_NOME == 'Pedidos' && 
                                    configs.getMovimentos().sistemaDeAprovacao
                                ) ? (
                                    (
                                        values.MOVIMENTOS_STATUS == 'B' || 
                                        values.MOVIMENTOS_STATUS == 'M' || 
                                        values.MOVIMENTOS_STATUS == 'E'
                                    ) ? "fundo-amarelo" :
                                    values.MOVIMENTOS_STATUS   == 'C' ? "vermelho" :
                                    values.MOVIMENTOS_SITUACAO == 'P' ? "verde"    :
                                    values.MOVIMENTOS_SITUACAO == 'A' ? "azul"     :
                                    values.MOVIMENTOS_SITUACAO == 'R' ? "lilas"    :
                                    values.MOVIMENTOS_STATUS   == 'F' ? "preto"    : 
                                                                        "azul"
                                ) : (
                                    values.MOVIMENTOS_STATUS == 'F' ? "preto"      :
                                    values.MOVIMENTOS_STATUS == 'N' ? "verde"      :
                                    values.MOVIMENTOS_STATUS == 'G' ? "fundo-azul" : 
                                    values.MOVIMENTOS_STATUS == 'H' ? "lilas"      : 
                                    values.MOVIMENTOS_STATUS == 'C' ? "vermelho"   :
                                    values.MOVIMENTOS_STATUS == 'D' ? "lilas"      :
                                    values.MOVIMENTOS_STATUS == 'A' ? "azul"       :
                                                                      "fundo-amarelo"
                                )
                            ]}"
                        >
                            <tr>
                                <td style="width:100%;font-weight:bold;font-size:16px;" colspan=4>{MOVIMENTOS_NOME}</td>
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
                                <td style="width: 50px;">Número</td>
                                <td style="font-weight:bold;flex-grow: 1;" colspan=5>{MOVIMENTOS_NUMERO}/{MOVIMENTOS_SERIE}</td>
                                <td style="width: 50px;">Emissão</td>
                                <td style="font-weight:bold;width: 80px;" colspan=5>{[ 
                                    moment(values.MOVIMENTOS_EMISSAO).format('DD/MM/YYYY')
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
                                <td style="width: 50px;"> {[values.MOVIMENTOS_CPFCNPJ.length == 11 ? "CPF" : "CNPJ"]}</td>
                                <td style="font-weight:bold;flex-grow: 1;">{[ 
                                    values.MOVIMENTOS_CPFCNPJ.length == 11 ? 
                                    Ext.util.Format.maskRenderer("999.999.999-99")(values.MOVIMENTOS_CPFCNPJ) : 
                                    Ext.util.Format.maskRenderer("99.999.999/9999-99")(values.MOVIMENTOS_CPFCNPJ)
                                ]}</td>
                                <td style="width: 30px;"> Fone</td>
                                <td style="font-weight:bold;width: 100px;">{[ 
                                    (values.MOVIMENTOS_CELULAR || values.MOVIMENTOS_TELEFONE || '').replace(/[^0-9]/g, '').length == 11 ?
                                    Ext.util.Format.maskRenderer("(99) 99999-9999")((values.MOVIMENTOS_CELULAR || values.MOVIMENTOS_TELEFONE || '').replace(/[^0-9]/g, '')) :
                                    (values.MOVIMENTOS_CELULAR || values.MOVIMENTOS_TELEFONE || '').replace(/[^0-9]/g, '').length == 10 ?
                                    Ext.util.Format.maskRenderer("(99) 9999-9999")((values.MOVIMENTOS_CELULAR || values.MOVIMENTOS_TELEFONE || '').replace(/[^0-9]/g, '')) :
                                    (values.MOVIMENTOS_CELULAR || values.MOVIMENTOS_TELEFONE || '').replace(/[^0-9]/g, '').length == 9 ?
                                    Ext.util.Format.maskRenderer("99999-9999")((values.MOVIMENTOS_CELULAR || values.MOVIMENTOS_TELEFONE || '').replace(/[^0-9]/g, '')) :
                                    (values.MOVIMENTOS_CELULAR || values.MOVIMENTOS_TELEFONE || '').replace(/[^0-9]/g, '').length == 8 ?
                                    Ext.util.Format.maskRenderer("9999-9999")((values.MOVIMENTOS_CELULAR || values.MOVIMENTOS_TELEFONE || '').replace(/[^0-9]/g, '')) :
                                    (values.MOVIMENTOS_CELULAR || values.MOVIMENTOS_TELEFONE || '').replace(/[^0-9]/g, '')
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
                                <td style="width: 50px;">Cidade</td>
                                <td style="font-weight:bold;flex-grow: 1;" colspan=5>{CIDADES_NOME}/{CIDADES_ESTADO}</td>
                                <td style="width: 50px;">Valor</td>
                                <td style="font-weight:bold;width: 80px;color:green;" colspan=5>{[ 
                                    Ext.util.Format.maskRenderer("#9.990,00", true, true)(values.MOVIMENTOS_TOTAL)
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