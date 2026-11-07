Ext.define('SamosAdmin.movimentos.movimento.form.impostositens.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentosimpostositens',

    requires: [
        'SamosAdmin.movimentos.movimento.form.impostositens.ViewModel',
        'SamosAdmin.movimentos.movimento.form.impostositens.ViewController'
    ],

    width: 950,

    rightbuttons: [
        'Confirmar',
        'Cancelar',
        'Sair'
    ],

    defaultFocus: 'textfield:editable:not([hidden]):not([disabled]):not([readOnly])',

    constructor: function () {
        Ext.apply(this, {
            height: Ext.$('formmovimentos')[0].getViewModel().get('isNotaEntrada') ? 520 : 430,  //460:420
            title: (Ext.$('formmovimentos')[0].getViewModel().get('isNotaEntrada') ||
                    Ext.$('formmovimentos')[0].getViewModel().get('isComplementar'))
                   ? 'Impostos - Produtos' : 'Dados Produtos',
            formgroups: [
                {
                    items: [
                        {   
                            items: [
                                {
                                    xtype: 'numberfield',                                    
                                    width: 105,
                                    flex: false,
                                    reference: 'codigoproduto',
                                    proximoFoco: 'nfe',
                                    fieldLabel: 'Produto',
                                    fieldStyle: 'text-align: right;',                                    
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_ID_PRODUTOS}'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'nomeproduto',
                                    proximoFoco: 'nfe',
                                    fieldLabel: 'Nome Produto',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PRODUTOS_NOME}'
                                    }
                                },
                                {
                                    width: 100,
                                    flex: false,
                                    fieldLabel: 'Qtde',
                                    reference: 'qtdeproduto',
                                    proximoFoco: 'nfe',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_QUANTIDADE}'
                                    }
                                }
                            ]
                        },
                        {   
                            items: [
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    flex: false,
                                    width: 105,
                                    fieldLabel: 'Operação',
                                    tabela: 'operacoes',
                                    reference: 'operacaonota',
                                    naoFocarAposPesquisar: true,
                                    callbackFn: 'focarProximoCampo',
                                    proximoFoco: 'icms',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    associations: [
                                        ['MOVIMENTOSITENS_ID_OPERACOES', 'OPERACOES_ID'],
                                        ['OPERACOES_NOME',               'OPERACOES_NOME']
                                    ],
                                    bind: {
                                        hidden: '{!(isNota || isRequisicao)}',
                                        value: '{model.MOVIMENTOSITENS_ID_OPERACOES}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 2,
                                    reference: 'nomeoperacaonota',
                                    proximoFoco: 'nfe',
                                    fieldLabel: 'Descrição',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!(isNota || isRequisicao)}',
                                        value: '{model.OPERACOES_NOME}'
                                    }
                                },
                                {
                                    xtype: 'numberfield',
                                    flex: false,
                                    width: 100,
                                    reference: 'seqpedido',
                                    enableKeyEvents: false,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 1,
                                    allowDecimals: false,
                                    fieldLabel: 'Seq Pedido',
                                    bind: {
                                        hidden: '{!isNotaComPedidoCompra && !isPedidoCompra}',
                                        value: '{model.MOVIMENTOSITENS_ID_EMPRESAS}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            bind: {
                                hidden: '{!isNota && !isPedidoCompra}'
                            },                                    
                            items: [
                                {
                                    xtype: 'combobox',
                                    width: 325,
                                    fieldLabel: 'Origem Produto',
                                    reference: 'origem',
                                    clicarNoProximoFoco: true,
                                    proximoFoco: 'cst',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    store: configs.getProdutos().origem,
                                    bind: {
                                        value: '{model.TABELA_ORIGEM}',
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'setarCSTProduto'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    width: 250,
                                    fieldLabel: 'CST ICMS',
                                    reference: 'cst',
                                    clicarNoProximoFoco: true,
                                    proximoFoco: 'confirmar',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    store: configs.getProdutos().cstlocal,
                                    bind: {
                                        value: '{model.TABELA_LOCAL}',
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'setarCSTProduto'
                                    }
                                },
                                {
                                    fieldLabel: '%ICMS',
                                    width: 65,
                                    reference: 'icms',
                                    proximoFoco: 'baseicms',
                                    xtype: 'samoswidgets-textmoney',
                                    minValue: 0,
                                    maxValue: 100,
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_ICMS}',
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'calcularValorIcms'
                                    }
                                },
                                {
                                    fieldLabel: 'Base ICMS',
                                    width: 100,
                                    reference: 'baseicms',
                                    proximoFoco: 'valoricms',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_BASEICMS}',
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'calcularValorIcms'
                                    }
                                },
                                {
                                    fieldLabel: 'Valor ICMS',
                                    width: 100,
                                    reference: 'valoricms',
                                    proximoFoco: 'ipi',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_VALORICMS}',
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}'
                                    }
                                },

                            ]
                        },
                        {
                            bind: {
                                hidden: '{!isNotaEntrada && !isFinalidadeEspecial && !isPedidoCompra && !isOperacoesIsentasPis}'
                            },
                            items: [
                                {
                                    xtype: 'combobox',
                                    width: 70,
                                    fieldLabel: 'CST PIS',
                                    reference: 'cstpis',
                                    clicarNoProximoFoco: true,
                                    proximoFoco: 'confirmar',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    store: [
                                        ['01', '01'],
                                        ['02', '02'],
                                        ['03', '03'],
                                        ['04', '04'],
                                        ['05', '05'],
                                        ['06', '06'],
                                        ['07', '07'],
                                        ['08', '08'],
                                        ['09', '09'],
                                        ['49', '49'],
                                        ['50', '50'],
                                        ['51', '51'],
                                        ['52', '52'],
                                        ['53', '53'],
                                        ['54', '54'],
                                        ['55', '55'],
                                        ['56', '56'],
                                        ['60', '60'],
                                        ['61', '61'],
                                        ['62', '62'],
                                        ['63', '63'],
                                        ['64', '64'],
                                        ['65', '65'],
                                        ['66', '66'],
                                        ['67', '67'],
                                        ['70', '70'],
                                        ['71', '71'],
                                        ['72', '72'],
                                        ['73', '73'],
                                        ['74', '74'],
                                        ['75', '75'],
                                        ['98', '98'],
                                        ['99', '99'],
                                        ['00', '00']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_CSTPIS}',
                                        hidden: '{(!isNotaEntrada && !isFinalidadeEspecial && !isOperacoesIsentasPis) || isNotaEntradaRacaforte}',
                                        readOnly: '{readOnly || (!isFinalidadeEspecial && !isOperacoesIsentasPis)}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    width: 70,
                                    fieldLabel: 'CST PIS',
                                    reference: 'cstpise',
                                    clicarNoProximoFoco: true,
                                    proximoFoco: 'confirmar',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    store: [
                                        ['50', '50'],
                                        ['51', '51'],
                                        ['52', '52'],
                                        ['54', '54'],
                                        ['55', '55'],
                                        ['56', '56'],
                                        ['60', '60'],
                                        ['61', '61'],
                                        ['62', '62'],
                                        ['63', '63'],
                                        ['64', '64'],
                                        ['65', '65'],
                                        ['66', '66'],
                                        ['67', '67'],
                                        ['70', '70'],
                                        ['71', '71'],
                                        ['72', '72'],
                                        ['73', '73'],
                                        ['74', '74'],
                                        ['75', '75'],
                                        ['98', '98'],
                                        ['99', '99']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_CSTPIS}',
                                        hidden: '{!isNotaEntradaRacaforte}',
                                        readOnly: '{readOnly || (!isFinalidadeEspecial && !isOperacoesIsentasPis)}'
                                    }
                                },
                                {
                                    fieldLabel: '% PIS',
                                    width: 60,
                                    reference: 'aliquotapis',
                                    proximoFoco: 'basepis',
                                    xtype: 'samoswidgets-textmoney',
                                    minValue: 0,
                                    maxValue: 100,
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_ALIQUOTAPIS}',
                                        hidden: '{!isNotaEntrada && !isFinalidadeEspecial}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}'
                                    },
                                    listeners: {
                                        keydown: 'calcularValorPis'
                                    }
                                },
                                {
                                    fieldLabel: 'Base PIS',
                                    width: 100,
                                    reference: 'basepis',
                                    proximoFoco: 'valorpis',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_BASEPIS}',
                                        hidden: '{!isNotaEntrada && !isFinalidadeEspecial}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}'
                                    },
                                    listeners: {
                                        keydown: 'calcularValorPis'
                                    }
                                },
                                {
                                    fieldLabel: 'Valor PIS',
                                    width: 80,
                                    reference: 'valorpis',
                                    proximoFoco: 'valorpisst',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        hidden: '{!isNotaEntrada && !isisFinalidadeEspecial}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}',
                                        value: '{model.MOVIMENTOSITENS_VALORPIS}'
                                    }
                                },
                                {
                                    fieldLabel: 'Valor PIS ST',
                                    width: 100,
                                    reference: 'valorpisst',
                                    proximoFoco: 'cofins',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_VALORPISST}',
                                        hidden: '{!isNotaEntrada && !isFinalidadeEspecial}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    width: 70,
                                    fieldLabel: 'CST Cofins',
                                    reference: 'cstcofins',
                                    clicarNoProximoFoco: true,
                                    proximoFoco: 'confirmar',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    store: [
                                        ['01', '01'],
                                        ['02', '02'],
                                        ['03', '03'],
                                        ['04', '04'],
                                        ['05', '05'],
                                        ['06', '06'],
                                        ['07', '07'],
                                        ['08', '08'],
                                        ['09', '09'],
                                        ['49', '49'],
                                        ['50', '50'],
                                        ['51', '51'],
                                        ['52', '52'],
                                        ['53', '53'],
                                        ['54', '54'],
                                        ['55', '55'],
                                        ['56', '56'],
                                        ['60', '60'],
                                        ['61', '61'],
                                        ['62', '62'],
                                        ['63', '63'],
                                        ['64', '64'],
                                        ['65', '65'],
                                        ['66', '66'],
                                        ['67', '67'],
                                        ['70', '70'],
                                        ['71', '71'],
                                        ['72', '72'],
                                        ['73', '73'],
                                        ['74', '74'],
                                        ['75', '75'],
                                        ['98', '98'],
                                        ['99', '99'],
                                        ['00', '00']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_CSTCOFINS}',
                                        hidden: '{(!isNotaEntrada && !isFinalidadeEspecial && !isOperacoesIsentasPis) || isNotaEntradaRacaforte}',
                                        readOnly: '{readOnly || (!isFinalidadeEspecial && !isOperacoesIsentasPis)}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    width: 70,
                                    fieldLabel: 'CST Cofins',
                                    reference: 'cstcofinse',
                                    clicarNoProximoFoco: true,
                                    proximoFoco: 'confirmar',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    store: [
                                        ['50', '50'],
                                        ['51', '51'],
                                        ['52', '52'],
                                        ['54', '54'],
                                        ['55', '55'],
                                        ['56', '56'],
                                        ['60', '60'],
                                        ['61', '61'],
                                        ['62', '62'],
                                        ['63', '63'],
                                        ['64', '64'],
                                        ['65', '65'],
                                        ['66', '66'],
                                        ['67', '67'],
                                        ['70', '70'],
                                        ['71', '71'],
                                        ['72', '72'],
                                        ['73', '73'],
                                        ['74', '74'],
                                        ['75', '75'],
                                        ['98', '98'],
                                        ['99', '99']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_CSTCOFINS}',
                                        hidden: '{!isNotaEntradaRacaforte}',
                                        readOnly: '{readOnly || (!isFinalidadeEspecial && !isOperacoesIsentasPis)}'
                                    }
                                },
                                {
                                    fieldLabel: '% Cofins',
                                    width: 60,
                                    xtype: 'samoswidgets-textmoney',
                                    minValue: 0,
                                    maxValue: 100,
                                    reference: 'cofins',
                                    proximoFoco: 'basecofins',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_ALIQUOTACOFINS}',
                                        hidden: '{!isNotaEntrada && !isFinalidadeEspecial}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}'
                                    },
                                    listeners: {
                                        keydown: 'calcularValorCofins'
                                    }
                                },
                                {
                                    fieldLabel: 'Base Cofins',
                                    width: 100,
                                    reference: 'basecofins',
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'valorcofins',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_BASECOFINS}',
                                        hidden: '{!isNotaEntrada && !isFinalidadeEspecial}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}'
                                    },
                                    listeners: {
                                        keydown: 'calcularValorCofins'
                                    }
                                },
                                {
                                    fieldLabel: 'Valor Cofins',
                                    width: 80,
                                    reference: 'valorcofins',
                                    proximoFoco: 'valorcofinsst',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_VALORCOFINS}',
                                        hidden: '{!isNotaEntrada && !isFinalidadeEspecial}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}'
                                    }
                                },
                                {
                                    fieldLabel: 'Valor Cofins ST',
                                    width: 98,
                                    reference: 'valorcofinsst',
                                    proximoFoco: 'frete',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_VALORCOFINSST}',
                                        hidden: '{!isNotaEntrada && !isFinalidadeEspecial}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: '% Frete',
                                    flex: 0.5,                                    
                                    reference: 'fretepercentual',
                                    proximoFoco: 'seguropercentual',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        hidden: '{!isPedidoCompra}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSITENS_ALIQUOTAPIS}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    fieldLabel: 'Frete',
                                    width: 100,
                                    reference: 'frete',
                                    proximoFoco: 'seguro',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly || (!isFinalidadeEspecial && !isNotaDevolucao) }',
                                        value: '{model.MOVIMENTOSITENS_FRETE}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    fieldLabel: '% Seguro',
                                    flex: 0.5,                                    
                                    reference: 'seguropercentual',
                                    proximoFoco: 'seguro',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        hidden: '{!isPedidoCompra}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSITENS_ALIQUOTACOFINS}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    fieldLabel: 'Seguro',
                                    reference: 'seguro',
                                    width: 100,
                                    proximoFoco: 'despesas',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {                                       
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSITENS_SEGURO}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    fieldLabel: 'Despesas',
                                    reference: 'despesas',
                                    width: 100,
                                    proximoFoco: 'cte',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {                                      
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSITENS_DESPESAS}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    width: 75,
                                    flex: false,
                                    reference: 'cstpisro',
                                    fieldLabel: 'CST PIS',
                                    fieldStyle: 'text-align: center;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isNotaEletronicaHerbiquimica}',                                        
                                        value: '{cstPis}'
                                    }
                                },
                                {
                                    width: 75,
                                    flex: false,
                                    xtype: 'samoswidgets-textmoney',                                                                        
                                    reference: 'alqpisro',
                                    fieldLabel: 'Aliquota PIS',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isNotaEletronicaHerbiquimica}',                                        
                                        value: '{aliquotaPis}'
                                    }
                                },
                                {
                                    width: 75,
                                    flex: false,
                                    reference: 'cstcofinsro',
                                    fieldLabel: 'CST COFINS',
                                    fieldStyle: 'text-align: center;',
                                    ui: 'field-readonly',                                   
                                    readOnly: true,
                                    bind: {              
                                        hidden: '{!isNotaEletronicaHerbiquimica}',
                                        value: '{cstCofins}'
                                    }
                                },   
                                {
                                    width: 100,
                                    flex: false,
                                    xtype: 'samoswidgets-textmoney',                                                                        
                                    reference: 'alqcofinsro',
                                    fieldLabel: 'Aliquota COFINS',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isNotaEletronicaHerbiquimica}',                                        
                                        value: '{aliquotaCofins}'
                                    }
                                },
                                {
                                    fieldLabel: Ext.$('formmovimentos')[0].getViewModel().get('isDevolucaoMoveis') ? 'Partida' : 
                                                configs.getClientName() == 'racaforte' ? 'Desp Anexa' : 'CT-e',
                                    reference: 'cte',
                                    width: 100,
                                    proximoFoco: 'complemento',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_IMPOSTO}',
                                        hidden: '{!isFinalidadeEspecial && !isNotaDevolucao}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    fieldLabel: 'Complemento',
                                    reference: 'complemento',
                                    width: 100,
                                    proximoFoco: 'cst',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        hidden: '{!isNotaEntrada}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}',                                    
                                        value: '{model.MOVIMENTOSITENS_DEPOSITO}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    width: 230,
                                    fieldLabel: 'Escrituração',
                                    reference: 'escrituracao',
                                    clicarNoProximoFoco: true,
                                    proximoFoco: 'excecao',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    store: [
                                        ['0', 'Com Credito IPI/ICMS'],
                                        ['1', 'Sem Credito IPI/ICMS Isento'],
                                        ['2', 'Sem Credito IPI/ICMS Outros'],
                                        ['3', 'Com Credito ICMS/IPI Isento'],
                                        ['4', 'Com Credito ICMS/IPI Outros'],
                                        ['5', 'Com Credito IPI/ICMS Isento'],
                                        ['6', 'Com Credito IPI/ICMS Outros']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_ESCRITURACAO}',
                                        hidden: '{!isNotaEntrada}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    width: 98,
                                    fieldLabel: 'Exceção',
                                    reference: 'excecao',
                                    clicarNoProximoFoco: true,
                                    proximoFoco: 'confirmar',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    store: [
                                        ['', 'Icms^Ipi'],
                                        ['0', 'Normal'],
                                        ['1', 'Outras']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_EXCECAO}',
                                        hidden: '{!isNotaEntrada}',
                                        readOnly: '{readOnly}'
                                    }
                                }                                                             
                            ]
                        },
                        {
                            items: [
                                {
                                    width: 105, // Lote vinculado à produção - Biomart
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Lote',
                                    tabela: 'lotes',
                                    reference: 'lote',
                                    proximoFoco: 'frete',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    associations: [
                                        ['LOTES_ID_PRODUTOS',           'LOTES_ID_PRODUTOS'],
                                        ['MOVIMENTOSITENS_ID_LOTES',    'LOTES_ID'],
                                        ['MOVIMENTOSITENS_HORAENTREGA', 'LOTES_REFERENCIA'],
                                        ['MOVIMENTOSITENS_DATAENTREGA', 'LOTES_FABRICACAO'],
                                        ['MOVIMENTOSITENS_DATAMONTAGEM','LOTES_VALIDADE']
                                    ],
                                    bind: {
                                        hidden: '{!isProducaoBiomart}',
                                        value: '{model.MOVIMENTOSITENS_HORAENTREGA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 105,
                                    xtype: 'datefield',                                    
                                    flex: false,
                                    reference: 'fabricacao',
                                    proximoFoco: 'validade',
                                    fieldLabel: 'Fabricação',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isProducaoBiomart}',
                                        value: '{model.MOVIMENTOSITENS_DATAENTREGA}'
                                    }                                    
                                },
                                {
                                    width: 105,
                                    xtype: 'datefield',                                    
                                    flex: false,
                                    reference: 'validade',
                                    proximoFoco: 'frete',
                                    fieldLabel: 'Validade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isProducaoBiomart}',                                        
                                        value: '{model.MOVIMENTOSITENS_DATAMONTAGEM}'
                                    }                                    
                                },
                                {   // Lote definido pelo derivado
                                    width: 105,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Lote',
                                    tabela: 'lotes',
                                    reference: 'lotemov',
                                    proximoFoco: 'frete',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    associations: [
                                        ['LOTES_REFERENCIA',         'LOTES_REFERENCIA'],
                                        ['MOVIMENTOSITENS_ID_LOTES', 'LOTES_ID'],
                                        ['LOTES_ID_PRODUTOS',        'LOTES_ID_PRODUTOS'],
                                        ['LOTES_FABRICACAO',         'LOTES_FABRICACAO'],
                                        ['LOTES_VALIDADE',           'LOTES_VALIDADE']
                                    ],
                                    bind: {
                                        hidden: '{!isProdutoLote}',
                                        value: '{model.LOTES_REFERENCIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_ID_LOTES}'
                                    }
                                },
                                {
                                    width: 105,
                                    xtype: 'datefield',                                    
                                    flex: false,
                                    reference: 'fabricacaolot',
                                    proximoFoco: 'validadelot',
                                    fieldLabel: 'Fabricação',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isProdutoLote}',                                        
                                        value: '{model.LOTES_FABRICACAO}'
                                    }                                    
                                },
                                {
                                    width: 105,
                                    xtype: 'datefield',                                    
                                    flex: false,
                                    reference: 'validadelot',
                                    proximoFoco: 'frete',
                                    fieldLabel: 'Validade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isProdutoLote}',                                        
                                        value: '{model.LOTES_VALIDADE}'
                                    }                                    
                                },
                                {
                                    fieldLabel: 'Descontos',
                                    reference: 'descontos',
                                    width: 100,
                                    proximoFoco: 'frete',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        hidden: '{!isFinalidadeEspecial && !isNotaDevolucao}',
                                        readOnly: '{readOnly || (!isFinalidadeEspecial && !isNotaDevolucao) }',
                                        value: '{model.MOVIMENTOSITENS_DESCONTOS}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    fieldLabel: 'R$ Compra',
                                    reference: 'compra',
                                    width: 100,
                                    proximoFoco: 'frete',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isFinalidadeEspecial}',
                                        readOnly: '{readOnly || !isFinalidadeEspecial}',
                                        value: '{model.MOVIMENTOSITENS_PRECO}'
                                    }
                                },
                                {                                    
                                    reference: 'numpedido',
                                    width: 100,
                                    xtype: 'textfield',
                                    proximoFoco: 'numitem',
                                    maxLength: 10,
                                    bind: {
                                        fieldLabel: '{isNotaEletronicaMTF ? "Número Ordem" : isNfeComReceita ? "Nº Receituário" : "xPed (XML)"}',
                                        hidden: '{!(isNotaEletronicaMTF || isOrcamentoRaca || isNotaEletronicaHerbiquimica)}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSITENS_HORAENTREGA}'
                                    }
                                },
                                {
                                    reference: 'numitem',
                                    width: 100,
                                    xtype: 'textfield',
                                    maxLength: 10,
                                    bind: {
                                        fieldLabel: '{isNotaEletronicaMTF ? "Número Item" : "nItemPed (XML)"}',                                        
                                        hidden: '{!(isNotaEletronicaMTF || isOrcamentoRaca || isNotaEletronicaHerbiquimica)}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSITENS_HORAMONTAGEM}'
                                    }
                                },
                                {
                                    fieldLabel: '%IPI',
                                    width: 60,
                                    xtype: 'samoswidgets-textmoney',
                                    minValue: 0,
                                    maxValue: 100,
                                    reference: 'ipi',
                                    proximoFoco: 'valoripi',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_IPI}',
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'calcularValorIpi'
                                    }
                                },
                                {
                                    fieldLabel: 'Valor IPI',
                                    width: 80,
                                    reference: 'valoripi',
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'basest',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_VALORIPI}',
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    fieldLabel: 'Base St',
                                    width: 90,
                                    reference: 'basest',
                                    proximoFoco: 'valorst',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSITENS_BASEST}'
                                    }
                                },
                                {
                                    fieldLabel: 'Valor St',
                                    width: 90,
                                    reference: 'valorst',
                                    proximoFoco: 'aliquotapis',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        hidden: '{!isNota}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSITENS_VALORST}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                }                                
                            ]
                        }
                    ]
                },
                {
                    bind: {
                        hidden: '{!isNotaEntrada && !isRequisicaoEntrada}'
                    },
                    items: [
                        {
                            items: [
                                {
                                    fieldLabel: 'R$ Custo',
                                    reference: 'rscustonovo',
                                    proximoFoco: 'margem',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        fieldStyle:'{isEntradaCustoNulo ? "color:purple;" : "color:black;"}',
                                        value: '{model.NOVO_CUSTO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularPreco'
                                    }
                                },
                                {
                                    fieldLabel: '% Margem',
                                    reference: 'margemnovo',
                                    proximoFoco: 'rsvista',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        fieldStyle:'{isEntradaCustoNulo ? "color:purple;" : "color:black;"}',
                                        value: '{model.NOVO_MARGEM}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'calcularPreco'
                                    }
                                },
                                {
                                    fieldLabel: configs.getProdutos().labelPreco,
                                    reference: 'rsvistanovo',
                                    proximoFoco: 'rsprazo',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.NOVO_PRECO}',
                                        fieldStyle:'{isEntradaCustoNulo ? "color:purple;" : "color:black;"}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: configs.getProdutos().labelPrazo,
                                    reference: 'rsprazonovo',
                                    proximoFoco: 'icms',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.NOVO_PRAZO}',
                                        fieldStyle:'{isEntradaCustoNulo ? "color:purple;" : "color:black;"}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    hidden: true,
                                    bind: {
                                        value: '{model.NOVO_COMPRA}'
                                    }
                                },
                                {
                                    fieldLabel: 'R$ Custo Ant',
                                    reference: 'rscusto',
                                    proximoFoco: 'margem',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_CUSTO}'
                                    }
                                },
                                {
                                    fieldLabel: '% Margem Ant',
                                    reference: 'margem',
                                    proximoFoco: 'rsvista',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.SALDOS_MARGEM}'
                                    }
                                },
                                {
                                    fieldLabel: configs.getProdutos().labelPreco,
                                    reference: 'rsvista',
                                    proximoFoco: 'rsprazo',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.SALDOS_PRECO}'
                                    }
                                },
                                {
                                    fieldLabel: configs.getProdutos().labelPrazo,
                                    reference: 'rsprazo',
                                    proximoFoco: 'icms',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.SALDOS_PRAZO}'
                                    }
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
