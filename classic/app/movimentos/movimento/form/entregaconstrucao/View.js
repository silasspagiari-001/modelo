Ext.define('SamosAdmin.movimentos.movimento.form.entregaconstrucao.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentosentregaconstrucao',

    requires: [
        'SamosAdmin.movimentos.movimento.form.entregaconstrucao.ViewModel',
        'SamosAdmin.movimentos.movimento.form.entregaconstrucao.ViewController'
    ],

    title: 'Entrega', 
    hidePaging: true,
    width: 1020,
    height: 520,
    defaultFocus: 'textfield[reference="entregue0"]',

    leftbuttons: [
        'Selecionar',
        'Loja',
        'Depósito',
        'Imediata',
        'Retirar'
    ],

    rightbuttons: [ 
        'Gravar',
        'Confirmar',
        'Cancelar',
        'Sair'
    ],
    
    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    defaults: {
                        defaults: {
                            flex: false,
                            width: 132
                        }
                    },
                    items: [
                        {
                            layout: 'fit',
                            items: [
                                {
                                    xtype: 'samoswidgets-griditems', 
                                    reference: 'gridentregas',
                                    heigth: 410,
                                    qtdeLinhasMinima: 0,
                                    name: 'MOVIMENTOS_ITENS',
                                    idProperty: 'MOVIMENTOSITENS_ID',
                                    bind: {
                                        store: '{produtos}'
                                    },
                                    listeners: {
                                        antesDePublicarModel: 'validarQtde',
                                    },        
                                    fields: [
                                        { hidden: true, name: 'MOVIMENTOSITENS_ID' },
                                        {
                                            title: 'Produto',
                                            width: 70,
                                            fieldStyle: 'text-align:right;',
                                            name: 'PRODUTOS_ID', //'MOVIMENTOSITENS_ID_PRODUTOS',
                                            readOnly: true
                                        },
                                        {
                                            title: 'Nome do Produto',
                                            flex: 1,
                                            xtype: 'textfield',
                                            name: 'PRODUTOS_NOME',
                                            readOnly: true
                                        },
                                        {
                                            title: 'Qtde',
                                            name: 'MOVIMENTOSITENS_QUANTIDADE',
                                            width: 60,
                                            xtype: 'numberfield',
                                            submitLocaleSeparator: false,
                                            decimalSeparator: ',',
                                            decimalPrecision: 3,
                                            hideTrigger: true,
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },
                                            readOnly: true
                                        },
                                        {
                                            title: 'Loja',
                                            name: 'MOVIMENTOSITENS_ENTREGUE',
                                            proximoFoco: 'deposito',
                                            width: 80,
                                            xtype: 'numberfield',
                                            submitLocaleSeparator: false,
                                            decimalSeparator: ',',
                                            minValue: 0,
                                            decimalPrecision: 3,
                                            hideTrigger: true,
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },
                                            hidden: !configs.getMovimentos().entrega.loja,
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }                           
                                        },
                                        {
                                            title: 'Depósito',
                                            name: 'MOVIMENTOSITENS_DEPOSITO',
                                            proximoFoco: 'imediata',
                                            width: 80,
                                            xtype: 'numberfield',
                                            submitLocaleSeparator: false,
                                            decimalSeparator: ',',
                                            decimalPrecision: 3,
                                            minValue: 0,
                                            hideTrigger: true,
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },
                                            hidden: !configs.getMovimentos().entrega.deposito,
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            title: 'Imediata',
                                            name: 'MOVIMENTOSITENS_IMEDIATA',
                                            proximoFoco: 'loja[linhadebaixo]',
                                            width: 80,
                                            xtype: 'numberfield',
                                            submitLocaleSeparator: false,
                                            decimalSeparator: ',',
                                            minValue: 0,
                                            decimalPrecision: 3,
                                            hideTrigger: true,
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },
                                            hidden: !configs.getMovimentos().entrega.imediata,
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            title: 'A Retirar',
                                            name: 'ITENS_ENTREGAR',
                                            width: 80,
                                            xtype: 'numberfield',
                                            submitLocaleSeparator: false,
                                            decimalSeparator: ',',
                                            minValue: 0,
                                            decimalPrecision: 3,
                                            hidden: !configs.getMovimentos().entrega.entregar,
                                            readOnly: true,
                                            fieldStyle: {
                                                textAlign: 'right'
                                            }
                                        },
                                        {
                                            title: 'Empresa',
                                            name: 'MOVIMENTOSITENS_ID_EMPRESAS',
                                            proximoFoco: 'data',
                                            width: 80,
                                            xtype: 'combobox',
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },
                                            hidden: !configs.getMovimentos().entrega.empresa,
                                            bind: {
                                                store: '{listaEmpresas}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            title: 'Data',
                                            name: 'MOVIMENTOSITENS_DATAENTREGA',
                                            proximoFoco: 'hora',
                                            width: 130,
                                            xtype: 'datefield',
                                            hidden: !configs.getMovimentos().entrega.data,
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            title: 'Hora',
                                            name: 'MOVIMENTOSITENS_HORAENTREGA',
                                            xtype: 'combobox',
                                            proximoFoco: 'loja[linhadebaixo]',
                                            width : 120,
                                            flex: false,
                                            align: 'center',                                                        
                                            hidden: !configs.getMovimentos().entrega.hora,
                                            store: [
                                                '06:00',
                                                '06:30',
                                                '07:00',
                                                '07:30',
                                                '08:00',
                                                '08:30',                                                            
                                                '09:00',
                                                '09:30',                                                            
                                                '10:00',
                                                '10:30',                                                            
                                                '11:00',
                                                '11:30',                                                            
                                                '12:00',
                                                '12:30',                                                            
                                                '13:00',
                                                '13:30',                                                            
                                                '14:00',
                                                '14:30',                                                            
                                                '15:00',
                                                '15:30',                                                            
                                                '16:00',
                                                '16:30',                                                            
                                                '17:00',
                                                '17:30',                                                            
                                                '18:00',
                                                '18:30',                                                            
                                                '19:00'
                                            ],
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            title: 'Seleção',
                                            width: 80,                                            
                                            name: 'ITENS_DEVOLUCAO',
                                            xtype: 'checkbox',
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }
                                        },        
                                        { hidden: true, name: 'MOVIMENTOSITENS_ID_LOTES' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_DATAMONTAGEM' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_PRECO' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_PERCENTUAL', },
                                        { hidden: true, name: 'MOVIMENTOSITENS_TOTAL' },
                                        { hidden: true, name: 'VALOR_LIQUIDO' },
                                        { hidden: true, name: 'TOTAL_LIQUIDO' },
                                        { hidden: true, name: 'ROMANEIOSENTREGA_NUMERO' },
                                        { hidden: true, name: 'ROMANEIOSENTREGA_NOME' },
                                        { hidden: true, name: 'ROMANEIOSMONTAGEM_NUMERO' },
                                        { hidden: true, name: 'ROMANEIOSMONTAGEM_NOME' },
                                        { hidden: true, name: 'SALDOS_MARGEM' },
                                        { hidden: true, name: 'SALDOS_MARKUP' },
                                        { hidden: true, name: 'SALDOS_TRANSFERENCIA' },
                                        { hidden: true, name: 'SALDOS_CUSTO' },
                                        { hidden: true, name: 'SALDOS_COMPRA' },
                                        { hidden: true, name: 'SALDOS_PRAZO' },
                                        { hidden: true, name: 'SALDOS_PRECO' },
                                        { hidden: true, name: 'SALDOS_PRECOMINIMO' },
                                        { hidden: true, name: 'PRECOMINIMO_DB' },
                                        { hidden: true, name: 'VALOR_PROMOCAO' },
                                        { hidden: true, name: 'SALDOS_DISPONIVEL' },
                                        { hidden: true, name: 'SALDOS_DEPOSITO' },
                                        { hidden: true, name: 'SALDOS_RESERVADO' },
                                        { hidden: true, name: 'SALDOS_CSTLOCAL' },
                                        { hidden: true, name: 'SALDOS_CSTOUTROS' },
                                        { hidden: true, name: 'SALDOS_IPI' },
                                        { hidden: true, name: 'SALDOS_ICMSLC' },
                                        { hidden: true, name: 'SALDOS_ICMS01' },
                                        { hidden: true, name: 'SALDOS_ICMS02' },
                                        { hidden: true, name: 'SALDOS_BASELC' },
                                        { hidden: true, name: 'SALDOS_BASE01' },
                                        { hidden: true, name: 'SALDOS_BASE02' },
                                        { hidden: true, name: 'SALDOS_LOCAL' },
                                        { hidden: true, name: 'PRODUTOS_STATUS' },
                                        { hidden: true, name: 'PRODUTOS_DERIVADO' },                                        
                                        { hidden: true, name: 'PRODUTOS_DERIVADO' },
                                        { hidden: true, name: 'PRODUTOS_PESOLIQUIDO' },
                                        { hidden: true, name: 'PRODUTOS_PESOBRUTO' },
                                        { hidden: true, name: 'NCMS_STATUS' },
                                        { hidden: true, name: 'NCMS_NCM' },
                                        { hidden: true, name: 'NCMS_ALIQUOTANACIONAL' },
                                        { hidden: true, name: 'NCMS_ALIQUOTAESTADUAL' },
                                        { hidden: true, name: 'NCMS_ALIQUOTAIMPORTADO' },
                                        { hidden: true, name: 'NCMS_ALIQUOTAMUNICIPAL' },
                                        { hidden: true, name: 'NCMS_CSTPIS' },
                                        { hidden: true, name: 'NCMS_ALIQUOTAPIS' },
                                        { hidden: true, name: 'NCMS_CSTCOFINS' },
                                        { hidden: true, name: 'NCMS_ALIQUOTACOFINS' },
                                        { hidden: true, name: 'NCMS_ALIQUOTAFCP' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_ID_OPERACOES' },
                                        { hidden: true, name: 'OPERACOES_NOME' },
                                        { hidden: true, name: 'EMPRESAS_FANTASIA' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_CUSTO' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_MARGEM' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_IMPOSTO' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_ALIQUOTAPIS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_CSTPIS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_BASEPIS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_VALORPIS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_VALORPISST' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_ALIQUOTACOFINS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_CSTCOFINS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_BASECOFINS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_VALORCOFINS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_VALORCOFINSST' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_ICMS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_BASEICMS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_VALORICMS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_FRETE' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_BASEST' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_VALORST' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_IPI' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_VALORIPI' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_SEGURO' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_DESPESAS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_DESCONTOS' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_CST' },
                                        { hidden: true, name: 'TABELA_ORIGEM' },
                                        { hidden: true, name: 'TABELA_LOCAL' },        
                                        { hidden: true, name: 'MOVIMENTOSITENS_ESCRITURACAO' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_EXCECAO' },
                                        { hidden: true, name: 'NOVO_CUSTO' },
                                        { hidden: true, name: 'NOVO_MARGEM' },
                                        { hidden: true, name: 'NOVO_PRECO' },
                                        { hidden: true, name: 'NOVO_PRAZO' },
                                        { hidden: true, name: 'NOVO_COMPRA' },
                                        { hidden: true, name: 'NOVO_FRETE' },
                                        { hidden: true, name: 'NOVO_DESPESAS' },
                                        { hidden: true, name: 'MONTAGENS_VALOR' },
                                        { hidden: true, name: 'MOVIMENTOSITENS_CSTIBSCBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_CCLASSTRIB'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_BASEIBSCBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_ALIQUOTAIBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_VALORIBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_PERREDIBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_PERDIFIBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_VLRDIFIBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_VLRDEVIBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_ALIQUOTACBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_VALORCBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_PERREDCBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_PERDIFCBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_VLRDIFCBS'},
                                        { hidden: true, name: 'MOVIMENTOSITENS_VLRDEVCBS'}
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }            
});
