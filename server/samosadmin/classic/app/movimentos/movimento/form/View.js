Ext.define('SamosAdmin.movimentos.movimento.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formmovimentos',

    requires: [
        'SamosAdmin.movimentos.movimento.form.ViewModel',
        'SamosAdmin.movimentos.movimento.form.ViewController',
        'SamosAdmin.movimentos.movimento.form.recuperacao.View',
        'SamosAdmin.movimentos.movimento.form.conferencia.View'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Emitir: Cliente, Abastecimento, Conferência, Pedido, Comprovante, Romaneio Entrega, Meia folha, Folha inteira',
        'Produtos',        
        'Caixa',
        'Pagamento',
        'Efetivar',
        'Liberar',
        'Manifesto: Confirmação da Operação, Desconhecimento da Operação, Operação Não Realizada',
        'Vincular',
        'Transferir para CD',
        'Colocar em separação',
        'Colocar em conferência',
        'Conferir',
        'Baixar',
        {
            type: 'file',
            accept: '.xml',
            hidden: true,
            action: 'CarregarXML'
        },
        'Importar: De Orçamento, De Requisição, De Pedido, De Pedido Compra, De XML, De Ordem Serviço',
        'Exportar: Para Pedido, Para Devolução, Para Nota Eletrônica, Para Requisição, Para Romaneio Entrega, Para Romaneio Montagem, Para Pedido Compra, Para Nota Consumidor, Para Ordem Serviço, Para Romaneio Cliente Retirou, Para Romaneio Entregue Orçamento',
        'Sefaz',
        'Opções: Aprovado, Reprovado, Pendente, Transporte, Dados Importação, Docs Vinculados, Entrega/Montagem, Reserva, Romaneio, Enviar Email, Enviar SMS, Gerar Link PDF, Transferir, Cancelamento, Reativar, Recepção, Alterar Emissão, Alterar Vendedor, Parciais, Gerar PDFs, Ajuste Data PDF, Casco'
    ],

    rightbuttons: [
        'Fechar',
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    constructor: function (config) {
        const tema = configs.getTema();
        const title = config.listName;

        if((title == 'Pedidos' || title == 'Orçamentos') && configs.getClientName() == 'hospitalar' || 
           (title == 'Pedidos' || title == 'Transferências') && configs.getClientName() == 'prudenmoveis') {
            // Botoes de impressao personalizados
        } else {
            SamosUtils.Utils.adicionarBotaoImpressao({
                btnName   : 'Imprimir',
                showLayout: true,
                index     : 4,
                visualizar: true,
                view      : this
            });
        }

        let formTitle;
        
        if (title == 'Orçamentos') {
            formTitle = 'Orçamento';
        } else if(title == 'Pré-vendas') {
            formTitle = 'Pré-venda';
        } else if(title == 'Pedidos Compra') {
            formTitle = 'Pedido Compra';               
        } else if(title == 'Solicitação Compra') {
            formTitle = 'Solicitação Compra';               
        } else if(title == 'Pedidos') {
            formTitle = 'Pedido';   
        } else if(title == 'Requisições'){
            formTitle = 'Requisição';    
        } else if(title == 'Devoluções'){
            formTitle = 'Devolução';    
        } else if(title == 'Nota Eletrônica' || title == 'Nota Entrada') {
            formTitle = 'Nota'; 
        } else if(title == 'Transferências') {
            formTitle = 'Transferência'; 
        }

        const vendaConsumidorTrigger = formTitle != 'Nota' && formTitle != 'Transferência' ? {
            edit: {
                cls: 'x-fa fa-edit',
                handler: 'onPessoasEditClick'
            }
        } : {};

        Ext.apply(this, {
            title: formTitle,
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    reference: 'pessoa',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    bind: {
                                        tabela: '{listName != "Transferências" ? "pessoas" : "empresas"}',
                                        fieldLabel: '{listName != "Transferências" ? "Pessoa" : "Empresa Origem"}',
                                        value: '{model.MOVIMENTOS_NOME}',
                                        hidden: '{isVendaConsumidor}',
                                        readOnly: '{readOnly || boletoImpresso}',
                                        ui: '{!boletoImpresso ? "textbold-' + tema + '" : "field-readonly"}',
                                        associations: '{pessoaAssociations}'
                                    },
                                    callbackFn: 'aposBuscarPessoa',
                                    triggers: vendaConsumidorTrigger,
                                    listeners: {
                                        //blur: 'onSairCampoPessoas'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 60,
                                    fieldLabel: 'Código',
                                    fieldStyle:'text-align:right;color:blue;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{hideIdPessoa}',
                                        value: '{model.MOVIMENTOS_ID_PESSOAS}'
                                    },
                                    listeners: {
                                        change: 'onPessoasChange'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 60,   
                                    fieldLabel: 'Propried.', 
                                    fieldStyle:'text-align:right;color:blue;',  
                                    bind: {
                                        readOnly: '{readOnly}',
                                        hidden: '{hidePropriedade}',
                                        value: '{model.MOVIMENTOS_ID_PROPRIEDADES}'
                                    },
                                    listeners: {
                                        change: 'onPropriedadesChange'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'nomepessoa',
                                    proximoFoco: 'entrega',
                                    fieldLabel: 'Pessoa',
                                    emptyText: 'Digite o nome...',
                                    bind: {
                                        readOnly: '{readOnly || boletoImpresso}',
                                        hidden: '{!isVendaConsumidor}',
                                        value: '{model.MOVIMENTOS_NOME}'
                                    },
                                    triggers: {
                                        close: {
                                            cls: 'x-fa fa-close',
                                            handler: 'onPessoasCloseClick'
                                        }
                                    }
                                },
                                {
                                    width: 120,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Entrega',
                                    reference: 'entrega',
                                    displayField: 'field2',
                                    editable: false,
                                    forceSelection: true,
                                    store: [
                                        [0, 'Selecione'],
                                        [1, 'Urbana'],
                                        [2, 'Suburbana']
                                    ],
                                    bind: {
                                        hidden: '{!isConsumidorPrudenMoveis}',
                                        proximoFoco:  'cpfcnpj',
                                        readOnly: '{readOnly}',
                                        fieldStyle: '{colorTheme}',
                                        value: '{model.MOVIMENTOS_ID_CUSTOS}'
                                    },
                                    listeners: {
                                        change: 'onEntregaChange'
                                    }
                                },        
                                {   // Tipo de documento Raçaforte
                                    width: 150,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldStyle: "color: blue",
                                    fieldLabel: 'Documento',
                                    reference: 'tipodocumento',
                                    displayField: 'field2',
                                    editable: false,
                                    forceSelection: true,
                                    store: [
                                        [0, 'Selecione'],
                                        [10001, 'Orçamento'],
                                        [10002, 'Nota Fiscal'],
                                        [10004, 'Pendência']
                                    ],
                                    bind: {
                                        hidden: '{hideComboDocumentos}',
                                        proximoFoco:  'cpfcnpj',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOS_ID_DOCUMENTOS}'
                                    }
                                },           
                                {
                                    flex: 1,
                                    reference: 'destino',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Empresa Destino',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isTransfEntrada}',
                                        value: '{model.EMPRESAS_FANTASIA}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 125,
                                    reference: 'fantasia',
                                    proximoFoco: 'email',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        fieldLabel: '{isPedidoCompra ? "Fantasia" : "Empresa Destino"}',
                                        hidden: '{!isTransfSaida && !isPedidoCompra}',
                                        value: '{model.PESSOAS_FANTASIA}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '___.___.___-__',
                                        '__.___.___/____-__'
                                    ],
                                    reference: 'cpfcnpj',
                                    flex: false,
                                    width: 165,
                                    proximoFoco: 'celular',
                                    fieldLabel: 'CPF/CNPJ',
                                    bind: {
                                        hidden: '{isTransferencia || hasPropriedade || !isVendaConsumidor}',
                                        ui: '{isVendaConsumidor ? "textbold-' + tema + '" : "field-readonly"}',
                                        readOnly: '{readOnly || !isVendaConsumidor}',
                                        value: '{model.MOVIMENTOS_CPFCNPJ}'
                                    },
                                    listeners: {
                                        change: 'changeCpfCnpj',
                                        keydown: 'validateCpf'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '___.___.___-__',
                                        '__.___.___/____-__'
                                    ],
                                    reference: 'cpfcnpjp',
                                    flex: false,
                                    width: 165,
                                    proximoFoco: 'celular',
                                    fieldLabel: 'CPF/CNPJ Propriedade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isTransferencia || !hasPropriedade}',
                                        value: '{model.PROPRIEDADES_CPFCNPJ}'
                                    }
                                },
                                {
                                    reference: 'cpfcnpjc',
                                    flex: false,
                                    width: 165,
                                    proximoFoco: 'celular',
                                    fieldLabel: 'CPF/CNPJ',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isTransferencia || hasPropriedade || isVendaConsumidor}',
                                        value: '{model.PESSOAS_CPFCNPJ}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '____-____',
                                        '_____-____',
                                        '(__) ____-____',
                                        '(__) _____-____'
                                    ],
                                    flex: false,
                                    width: 150,
                                    reference: 'celular',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Celular',
                                    bind: {
                                        hidden: '{isTransferencia || hasPropriedade || !isVendaConsumidor}',                                        
                                        readOnly: '{readOnly  || !isVendaConsumidor}',                                        
                                        value: '{model.MOVIMENTOS_CELULAR}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 150,
                                    reference: 'celularc',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Celular',
                                    readOnly: true,     
                                    ui: 'field-readonly',                                                                   
                                    bind: {
                                        hidden: '{isTransferencia || hasPropriedade || isVendaConsumidor}',                                        
                                        value: '{model.PESSOAS_CELULAR}'
                                    }
                                },                                
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '____-____',
                                        '_____-____',
                                        '(__) ____-____',
                                        '(__) _____-____'
                                    ],
                                    flex: false,
                                    width: 150,
                                    reference: 'telefonep',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Telefone',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isTransferencia || !hasPropriedade}',                                        
                                        value: '{model.PROPRIEDADES_CELULAR}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 130,
                                    flex: false,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    bind: {
                                        proximoFoco: '{isNotaEntrada ? "numeroentrada" : "email"}',
                                        readOnly: '{readOnly || boletoImpresso || (!isNotaEntrada && !isRequisicaoEntrada && !isPedidoCompra)}',
                                        ui: '{boletoImpresso || (!isNotaEntrada && !isRequisicaoEntrada && !isPedidoCompra) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_EMISSAO}'
                                    },
                                    listeners: {
                                        blur: 'copiarParaRecepcao'
                                    }
                                },
                                {
                                    flex: false,
                                    width: configs.getClientName() == 'hospitalar' ? 110 : 95,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    proximoFoco: 'serie',
                                    fieldStyle:'text-align:right;color:red;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isNotaEntrada || isRequisicaoEditavel}',
                                        value: '{modelNumero}'
                                    }
                                },
                                {
                                    width: 95,
                                    xtype: 'numberfield',
                                    hideTrigger: true,
                                    fieldLabel: 'Número',
                                    reference: 'numeroentrada',
                                    proximoFoco: 'serieentrada',
                                    enableKeyEvents: true,
                                    decimalPrecision: 0,
                                    hideTrigger: true,
                                    fieldStyle: {
                                        textAlign: 'right',
                                        color: 'red'
                                    },
                                    bind: {
                                        hidden: '{!isNotaEntrada && !isRequisicaoEditavel}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOS_NUMERO}'
                                    },
                                    listeners: {
                                        keydown: 'checarNotaExistente'
                                    }
                                },
                                {
                                    flex: false,
                                    width: configs.getClientName() == 'hospitalar' ? 70 : 60,
                                    fieldLabel: 'Série',
                                    reference: 'serie',
                                    proximoFoco: 'email',
                                    fieldStyle:'color:red',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        hidden: '{isNotaEntrada || isRequisicaoEditavel}',
                                        value: '{modelSerie}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 60,
                                    fieldLabel: 'Série',
                                    reference: 'serieentrada',
                                    proximoFoco: 'email',
                                    fieldStyle:'color:red',
                                    bind: {
                                        hidden: '{!isNotaEntrada && !isRequisicaoEditavel}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOS_SERIE}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    reference: 'endereco',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Endereço',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isMovtoCentroCusto || hasPropriedade}',
                                        value: '{model.PESSOAS_ENDERECO}'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'enderecop',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Endereço',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isMovtoCentroCusto || !hasPropriedade}',
                                        value: '{model.PROPRIEDADES_ENDERECO}'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'cidade',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Cidade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isMovtoCentroCusto || hasPropriedade}',
                                        value: '{model.CIDADES_NOME}'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'cidadep',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Cidade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isMovtoCentroCusto || !hasPropriedade}',
                                        value: '{model.CIDADES_NOMEPROPRIEDADE}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 45,
                                    reference: 'estado',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Estado',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isMovtoCentroCusto || hasPropriedade}',                                        
                                        value: '{model.CIDADES_ESTADO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 45,
                                    reference: 'estadop',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Estado',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isMovtoCentroCusto || !hasPropriedade}',                                        
                                        value: '{model.CIDADES_ESTADOPROPRIEDADE}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 150,                                        
                                    reference: 'log',
                                    proximoFoco: 'rsdescontos',
                                    fieldLabel: 'Log',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green;font-size:8px',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_LOG}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Aplicação',
                                    tabela: 'aplicacoes',
                                    reference: 'aplicacao',
                                    proximoFoco: 'custos',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['APLICACOES_NOME',          'APLICACOES_NOME'],
                                        ['MOVIMENTOS_ID_APLICACOES', 'APLICACOES_ID']
                                    ],
                                    bind: {
                                        hidden: '{!isMovtoCentroCusto}',
                                        value: '{model.APLICACOES_NOME}',
                                        readOnly: '{readOnly}'
                                    } 
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_ID_APLICACOES}'
                                    }
                                },
                                {
                                    width: 150, // Combo forma pagamento Prudenmóveis
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Forma de Pagto',
                                    reference: 'venda_forma',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    forceSelection: true,
                                    editable: false,
                                    store: [
                                        [620, 'Cartão'],
                                        [619, 'Carnê'],
                                        [617, 'Partida']
                                    ],
                                    bind: {
                                        hidden: '{!isPedOrcPrudenmoveis}',
                                        readOnly: '{readOnly}',
                                        fieldStyle: "color: blue",
                                        value: '{model.MOVIMENTOS_ID_APLICACOES}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: (configs.getMovimentos().labelCentroCusto ? configs.getMovimentos().labelCentroCusto :'Centro de Custo'),
                                    tabela: 'custos',
                                    reference: 'custos',
                                    proximoFoco: 'portador',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['CUSTOS_NOME',            'CUSTOS_NOME'],
                                        ['MOVIMENTOS_ID_CUSTOS',   'CUSTOS_ID']
                                    ],
                                    bind: {
                                        hidden: '{!isMovtoCentroCusto && !isMovtoCentroCustoRaca}',
                                        value: '{model.CUSTOS_NOME}',
                                        readOnly: '{readOnly}'
                                    } 
                                },
                                {
                                    fieldLabel: 'Código',
                                    width: 70,
                                    bind: {
                                        readOnly: true,
                                        hidden: '{!isMovtoCentroCustoRaca || isNotaEletronica}',
                                        value: '{model.MOVIMENTOS_ID_CUSTOS}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 130,
                                    flex: false,
                                    reference: 'faturado',
                                    proximoFoco: 'atualiza',
                                    bind: {
                                        fieldLabel: '{(listName == "Nota Entrada" || listName == "Requisições" || listName == "Pedidos Compra") ? "Recepção" : "Faturado"}',
                                        hidden: '{isDevolucao}',
                                        readOnly: '{readOnly || boletoImpresso || (!isNotaEntrada && !isRequisicaoEntrada && !isSupervisor)}',
                                        ui: '{boletoImpresso || (!isNotaEntrada && !isRequisicaoEntrada && !isSupervisor) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_ENTRADASAIDA}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 150,
                                    flex: false,
                                    fieldLabel: 'Devolvido',
                                    reference: 'devolvido',
                                    proximoFoco: 'rsdescontos',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!isDevolucao}',
                                        value: '{model.MOVIMENTOS_ENTRADASAIDA}'
                                    }
                                },                                
                                {
                                    width: configs.getClientName() == 'hospitalar' ? 185 : 160,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        store: '{storeStatus}',
                                        hidden: '{isDevolucao}',
                                        fieldStyle: '{isCancelado ? "color:red" : (isDenegado || isBaixado) ? "color:purple" : isDevolvido ? "color:purple" : isRecusado ? "color:purple" : "color:green"}',
                                        value: '{model.MOVIMENTOS_STATUS}'
                                    }
                                },
                                {
                                    width: 160,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'statusdev',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['N', 'Não Efetivado'],
                                        ['M', 'Não Efetivado'],
                                        ['F', 'Efetivado'],
                                        ['E', 'Efetivado'],
                                        ['C', 'Cancelado'],
                                        ['B', 'Cancelado'],
                                        ['D', 'Denegada']
                                    ],
                                    bind: {
                                        hidden: '{!isDevolucao}',
                                        fieldStyle: '{isCancelado ? "color:red" : isDenegado ? "color:purple" : "color:green"}',
                                        value: '{model.MOVIMENTOS_STATUS}'                                      
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    reference: 'vendedor',
                                    proximoFoco: 'rsdescontos',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    callbackFn: 'updateLog',
                                    associations: [
                                        ['USUARIOS_NOME',           'USUARIOS_NOME'],
                                        ['MOVIMENTOS_ID_USUARIOS',  'USUARIOS_ID'],
                                        ['USUARIOS_LOGIN',          'USUARIOS_LOGIN']
                                    ],
                                    bind: {
                                        fieldLabel: '{(listName == "Nota Entrada" || listName == "Transferências" || listName == "Pedidos Compra" || listName == "Solicitação Compra") ? "Usuário" : "Vendedor"}',
                                        hidden: '{isTransferencia}',
                                        readOnly: '{readOnly || readOnlyVendedor || readOnlyTipoUsuario || boletoImpresso || isNotaEntrada || isRequisicaoEntrada}',
                                        ui: '{readOnly || readOnlyVendedor || readOnlyTipoUsuario || boletoImpresso || isNotaEntrada || isRequisicaoEntrada ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: configs.getClientName() == 'prudenmoveis' ? '{nickName}' : '{model.USUARIOS_NOME}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_ID_USUARIOS}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_LOGIN}'
                                    }
                                },
                                {
                                    flex: false, // Profissional que indicou a venda
                                    width: 110,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    reference: 'profissional',
                                    proximoFoco: 'rsdescontos',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    callbackFn: 'updateLog',
                                    associations: [
                                        ['PROFISSIONAIS_NOME',      'USUARIOS_NOME'],
                                        ['MOVIMENTOS_PROTOCOLO',    'USUARIOS_ID']
                                    ],
                                    bind: {
                                        fieldLabel: 'Profissional',
                                        hidden: '{!isPedidoLislais}',
                                        readOnly: '{readOnly}',
                                        value: '{model.PROFISSIONAIS_NOME}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_PROTOCOLO}'
                                    }
                                },
                                {
                                    reference: 'pedcompra',
                                    fieldLabel: 'Pedido Cliente',
                                    flex: false,
                                    width: 110,
                                    proximoFoco: 'nitemcompra',                                    
                                    bind: {
                                        hidden: '{!isNotaEletronica || !informaPedido}',
                                        readOnly: '{readOnly}',
                                        value: '{model.PEDIDO_NUMERO}'
                                    },
                                },
                                {
                                    reference: 'nitemcompra',
                                    fieldLabel: 'Item',
                                    flex: false,
                                    width: 40,
                                    bind: {
                                        hidden: '{!isNotaEletronica || !informaPedido}',
                                        readOnly: '{readOnly}',
                                        value: '{model.PEDIDO_ITEM}'
                                    },
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Solicitante',
                                    reference: 'solicitante',
                                    proximoFoco: 'seguropercentual',
                                    maxLength: 15,
                                    bind: {
                                        hidden: '{!isSolicitacaoCompra}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOS_PROTOCOLO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 150,
                                    fieldLabel: 'Retirado por',
                                    reference: 'retirado',
                                    proximoFoco: 'seguropercentual',
                                    maxLength: 15,
                                    bind: {
                                        hidden: '{!isRequisicao || !isOperacaoSaida}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOS_PROTOCOLO}'
                                    }
                                },
                                {
                                    width: 150, // Controle montagem Prudenmoveis
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Montagem',
                                    reference: 'montagem_tipo',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    forceSelection: true,
                                    editable: false,
                                    store: [
                                        ['ADQ', 'Adquirida'],
                                        ['ABA', 'Abatida'],
                                        ['MOP', 'Já solicitada'],
                                        ['', 'Não aplicável']
                                    ],
                                    bind: {
                                        hidden: '{!isPedOrcPrudenmoveis}',
                                        readOnly: '{readOnly}',
                                        fieldStyle: "color: blue",
                                        value: '{model.MOVIMENTOS_NFE}'
                                    }
                                },
                                {
                                    width: 105,
                                    flex: false,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Operação',
                                    tabela: 'operacoes',
                                    reference: 'operacaorequisicao',
                                    proximoFoco: 'rsdescontos',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    associations: [
                                        ['MOVIMENTOS_ID_OPERACOES', 'OPERACOES_ID'],
                                        ['OPERACOES_NOME',          'OPERACOES_NOME'],
                                        ['OPERACOES_ICMS',          'OPERACOES_ICMS'],
                                        ['OPERACOES_ST',            'OPERACOES_ST'],
                                        ['OPERACOES_PISCOFINS',     'OPERACOES_PISCOFINS'],
                                        ['OPERACOES_ESTOQUE',       'OPERACOES_ESTOQUE'],
                                        ['OPERACOES_FINANCEIRO',    'OPERACOES_FINANCEIRO'],
                                        ['OPERACOES_FINALIDADE',    'OPERACOES_FINALIDADE'],
                                        ['OPERACOES_TIPO',          'OPERACOES_TIPO'],
                                        ['OPERACOES_ACAO',          'OPERACOES_ACAO'],
                                        ['OPERACOES_BAIXAVISTA',    'OPERACOES_BAIXAVISTA'],
                                        ['OPERACOES_UNICA',         'OPERACOES_UNICA'],
                                        ['OPERACOES_COMPLEMENTAR',  'OPERACOES_COMPLEMENTAR'],
                                        ['MOVIMENTOS_ID_PRAZOS',    'OPERACOES_ID_PRAZOS'],
                                        ['PRAZOS_NOME',             'PRAZOS_NOME'],
                                        ['MOVIMENTOS_ID_APLICACOES','OPERACOES_ID_APLICACOES'],
                                        ['APLICACOES_NOME',         'APLICACOES_NOME']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOS_ID_OPERACOES}',
                                        hidden: '{!isRequisicao && !isTransferencia && !isPedidoMalacrida}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    reference: 'nomeoperacaorequisicao',
                                    proximoFoco: 'rsdescontos',
                                    fieldLabel: 'Descrição',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        width: '{isTransferencia ? 246 : 160}',
                                        hidden: '{!isRequisicao && !isTransferencia && !isPedidoMalacrida}',
                                        value: '{model.OPERACOES_NOME}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textlower',
                                    reference: 'email',
                                    fieldLabel: 'Email',
                                    flex: 1,
//                                  width: 295,
                                    bind: {
                                        proximoFoco: '{isNotaEntrada ? "faturado" : boletoImpresso ? "situacao" : "produto0"}',
                                        hidden: '{isRequisicao || isMovtoCentroCusto || isNotaEletronica || isPedidoHospitalar}',                                        
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOS_EMAIL}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    flex: false,
                                    width: 150,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Condição de Pagto',
                                    tabela: 'prazos',
                                    reference: 'prazo',
                                    proximoFoco: 'produto0',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PRAZOS_NOME',           'PRAZOS_NOME'],
                                        ['MOVIMENTOS_ID_PRAZOS',  'PRAZOS_ID'],
                                        ['PRAZOS_PARCELAMENTO',   'PRAZOS_PARCELAMENTO'],
                                        ['PRAZOS_PARCELAS',       'PRAZOS_PARCELAS']
                                    ],
                                    bind: {
                                        hidden: '{!isPedidoCompra && !isPreVendaPrazo && !isOrcamentoPrazo && !isClientPrazo}',
                                        readOnly: '{readOnly}',
                                        value: '{model.PRAZOS_NOME}'
                                    },
                                    listeners: {
                                        //blur: 'onSairCampoPrazos'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_ID_PRAZOS}'
                                    }
                                },
                                {
                                    width: 150,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Atualiza',
                                    reference: 'atualiza',
                                    displayField: 'field2',
                                    editable: false,
                                    store: configs.getMovimentos().atualizaEntrada ? configs.getMovimentos().atualizaEntrada : 
                                    [
                                        ['0', 'Pagar/Custo'],
                                        ['1', 'Pagar'],
                                        ['2', 'Custo'],
                                        ['3', 'Não atualizar']
                                    ],
                                    bind: {
                                        hidden: '{(listName != "Nota Entrada" && listName != "Requisições") || isOperacaoSaida}',
                                        proximoFoco:  '{isNotaEntrada ? "pedido" : "hora"}',
                                        readOnly: '{readOnly}',
                                        fieldStyle: "color: blue",
                                        value: '{model.MOVIMENTOS_SITUACAO}'
                                    },
                                    listeners: {
                                        change: 'iniciarEdicao'
                                    }
                                },
                                {
                                    width: 110, // 100
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Situação',
                                    reference: 'situacao',
                                    proximoFoco: 'fechar',
                                    clicarNoProximoFoco: true,
                                    displayField: 'field2',
                                    editable: false,
                                    store: configs.getMovimentos().conferenciaItensPedido ? [
                                        [0, 'A Conferir'],
                                        [1, 'Conferido']
                                    ] : configs.getMovimentos().sistemaDeAprovacao ? [
                                        ['P', 'Pendente'],
                                        ['A', 'Aprovado'],
                                        ['R', 'Reprovado']
                                    ] : configs.getClientName() == 'acomtf' ? [
                                        [0, 'Retirado'],
                                        [1, 'Entregar']
                                    ] : [
                                        [0, 'Entregue'],
                                        [1, 'Entregar'],
                                        [2, 'Baixado']
                                    ],
                                    bind: {
                                        ui: configs.getMovimentos().conferenciaItensPedido ? 'field-readonly' : '{isSistemaAprovacao ? "field-readonly" : "textbold-' + tema + '"}',
                                        hidden: '{(!isPedido || isSaidaRacaforte)}',
                                        fieldStyle: '{isReprovado ? "color:red" : isPendente ? "color:blue" : "color:green"}',
                                        readOnly: configs.getMovimentos().conferenciaItensPedido ? true : '{isSistemaAprovacao ? true : readOnly}',
                                        value: '{model.MOVIMENTOS_SITUACAO}'
                                    },
                                    listeners: {
                                        change: 'analisarSituacao'
                                    }
                                },
                                {
                                    width: 150,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Caixa',
                                    reference: 'caixa_tipo',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    editable: false,
                                    store: [
                                        ['0', 'Abatimento Financeiro'],
                                        ['1', 'Crédito Cliente'],
                                        ['2', 'Sangria Caixa'],
                                        ['3', 'Nulo']
                                    ],
                                    bind: {
                                        hidden: '{!isDevolucao}',
                                        readOnly: '{readOnly}',
                                        fieldStyle: "color: blue",
                                        value: '{model.MOVIMENTOS_SITUACAO}'
                                    }
                                },
                                {
                                    width: 150,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo Pedido',
                                    reference: 'compra_tipo',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    editable: false,
                                    store: [
                                        ['P', 'Compra'],
                                        ['A', 'Assistência'],
                                        ['G', 'Propaganda']
                                    ],
                                    bind: {
                                        hidden: '{!isPedidoCompraMoveis}',
                                        readOnly: '{readOnly}',
                                        fieldStyle: "color: blue",
                                        value: '{model.MOVIMENTOS_SITUACAO}'
                                    }
                                },
                                {
                                    width: 150,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'venda_tipo',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    forceSelection: true,
                                    editable: false,
                                    store: [
                                        ['A', 'Boleto'],
                                        ['B', 'Dinheiro'],
                                        ['C', 'Débito Cartão'],
                                        ['D', 'Crédito Cartão'],
                                        ['E', 'Pix'],
                                        ['F', 'Cheque'],
                                        ['H', 'Orçamento Mobile'],
                                        ['I', 'Vale Vendedor'],
                                        ['G', 'Outro']
                                    ],
                                    bind: {
                                        hidden: '{!isSaidaRacaforte}',
                                        readOnly: '{readOnly}',
                                        fieldStyle: "color: blue",
                                        value: '{model.MOVIMENTOS_SITUACAO}'
                                    }
                                },
                                {
                                    width: 150,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'nota_tipo',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    forceSelection: true,
                                    editable: false,
                                    store: [
                                        ['R', 'Revenda'],
                                        ['C', 'Consumo'],
                                        ['O', 'Outro']
                                    ],
                                    bind: {
                                        hidden: '{!isNotaOzoniobras}',
                                        readOnly: '{readOnly}',
                                        fieldStyle: "color: blue",
                                        value: '{model.MOVIMENTOS_SITUACAO}'
                                    }
                                },                                
                                {
                                    flex: false,
                                    fieldLabel: 'Hora',
                                    reference: 'hora',
                                    proximoFoco: 'numeroorigem',
                                    maxLength: 8,
                                    bind: {
                                        width: '{(listName == "Nota Entrada" || isHerbiquimica) ? 130 : 75}',
                                        readOnly: '{readOnly || !isNotaEntrada}',
                                        ui: '{!isNotaEntrada ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_HORA}'
                                    }
                                },
                                {
                                    width: 45, //55
                                    flex: false,
                                    fieldLabel: 'Orig',
                                    reference: 'empresaorigem',
                                    proximoFoco: 'rsdescontos',
                                    ui: 'field-readonly',
                                    fieldStyle:'text-align:right',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{listName == "Nota Entrada"}',
                                        value: '{model.MOVIMENTOS_ID_EMPRESAORIGEM}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 95,
                                    xtype: 'samoswidgets-textsearch',
                                    documento: 'Requisição',
                                    valueStatus: 2,      
                                    tabela: 'movimentos',
                                    reference: 'requisicao',
                                    proximoFoco: 'produto0',
                                    pesquisaObrigatoria: false,
                                    pesquisaApenasJanela: true,
                                    permitirApenasNumeros: true,
                                    fieldLabel: 'Requisição',    
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['MOVIMENTOS_NUMEROORIGEM',    'MOVIMENTOS_NUMERO'],
                                        ['MOVIMENTOS_ID_EMPRESAORIGEM','MOVIMENTOS_ID_EMPRESAS'],
                                        ['MOVIMENTOS_SERIEORIGEM',     'MOVIMENTOS_SERIE'],
                                        ['PESSOAS_IDREQUISICAO',       'MOVIMENTOS_ID_PESSOAS']
                                    ], 
                                    bind: {
                                        hidden: '{!isNotaComRequisicao}',
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOS_NUMEROORIGEM}'
                                    }
                                },
                                {
                                    width: 65,
                                    reference: 'numeroorigem',
                                    proximoFoco: 'serieorigem',
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    decimalPrecision: 0,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {
                                        hidden: '{isNotaComRequisicao}',
                                        fieldLabel: '{listName == "Nota Entrada" ? "Nº Pedido" : "Número"}',
                                        readOnly: '{readOnly || !isNotaEntrada}',
                                        ui: '{!isNotaEntrada ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_NUMEROORIGEM}'
                                    }
                                },
                                {
                                    width: 40,
                                    reference: 'serieorigem',
                                    fieldLabel: 'Série',
                                    bind: {
                                        proximoFoco: '{isNotaEntrada ? "frete" : "rsdescontos"}',
                                        readOnly: '{readOnly || !isNotaEntrada}',
                                        ui: '{!isNotaEntrada ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_SERIEORIGEM}'
                                    }
                                },
                                {
                                    width: 130,
                                    xtype: 'textfield',
                                    fieldLabel: 'ID VTEX',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {
                                        hidden: configs.getClientName() == 'hospitalar' ? '{!isPedido}' :  true,
                                        value: '{model.MOVIMENTOS_PROTOCOLO}'
                                    }
                                },
                                {
                                    width: 185,
                                    xtype: 'textfield',
                                    fieldLabel: 'Pedido VTEX',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {
                                        hidden: configs.getClientName() == 'hospitalar' ? '{!isPedido}' :  true,
                                        value: '{model.MOVIMENTOS_NFE}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    layout: 'hbox',
                    height: '0',
                    xtype: 'component',
                    padding: '0',
                    ui: 'default',
                    listeners: {},
                    bind: {
                        html: '{marcaDaguaText}',
                        style: '{marcaDaguaStyle}'
                    }
                },
                {
                    title: 'Observações',
                    ui: 'formpanel-noheader-' + tema,
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',
                            padding: '10',
                            height: 118,
                            flex: 1,
                            layout: 'fit',
                            items: [
                                {
                                    xtype: 'samoswidgets-textlist',
                                    height: 118,
                                    lines: (title == 'Pré-vendas' || 
                                            title == 'Pedidos Compra' || 
                                           (title == 'Orçamentos' && configs.getMovimentos().prazosOrcamento)) ? 3 : 6,
                                    lineHeight: 30,
                                    maxLength: 60,
                                    reference: 'observacoes',
                                    proximoFoco: 'rsdescontos', 
                                    bind: {
                                        hidden: '{isMovimentoStiloMoveis}',                                        
                                        value: '{model.MOVIMENTOS_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'textarea',
//                                  fieldLabel: 'Observações',
                                    flex: 1,
                                    height: 118,
                                    maxLength: 512,
                                    reference: 'observacoes',                                    
                                    bind: {                  
                                        hidden: '{!isMovimentoStiloMoveis}',
                                        value: '{model.MOVIMENTOS_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    }
                                }        
                            ]
                        },
                        //APENAS PARA PRUDEN AÇO, Campo que mostra os vencimentos e valores para o PEDIDO
                        ...(
                            (configs.getClientName() == 'prudenaco' && title == 'Pedidos') ? [
                                {
                                    xtype: 'container',
                                    margin: '3 0 0 10',
                                    padding: '0',
                                    defaultType: 'fieldcontainer',
                                    layout: 'vbox',
                                    width: 222,
                                    height: 123,
                                    scrollable: 'y',
                                    items: [
                                        {
                                            xtype: 'samoswidgets-griditems-readonly',
                                            padding: '0',
                                            reference: 'financeiroscompra',
                                            qtdeLinhasMinima: 3,
                                            permitidoGridVazia: true,
                                            name: 'BAIXASPARCIAIS_MOVIMENTO',
                                            idProperty: 'CREDITOS_ID',
                                            descartarSeVazio: 'CREDITOS_EMISSAO',
                                            bind: {
                                                store: '{baixasparciais}'
                                            },
                                            fields: [
                                                { hidden: true, name: 'CREDITOS_ID' },
                                                { hidden: true, name: 'CREDITOS_ID_MOVIMENTOS' },
                                                {
                                                    title: 'Pgto',
                                                    name: 'CREDITOS_EMISSAO',
                                                    xtype: 'datefield',
                                                    width : 120,
                                                    align: 'center',
                                                    bind: {
                                                        readOnly: '{readOnly}'
                                                    }
                                                },
                                                {
                                                    empty: true,
                                                    title: 'Valor',
                                                    name: 'CREDITOS_VALOR',
                                                    width : 90,
                                                    xtype: 'samoswidgets-textmoney',
                                                    bind: {
                                                        readOnly: '{readOnly}'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ] : []
                        ),
                        ...(
                            title == 'Pré-vendas' || 
                            title == 'Pedidos Compra' || 
                           (title == 'Orçamentos' && configs.getMovimentos().prazosOrcamento) ? [{
                                xtype: 'container',
                                margin: '3 0 0 10',
                                padding: '0',
                                defaultType: 'fieldcontainer',
                                layout: 'vbox',
                                width: 222,
                                height: 123,
                                scrollable: 'y',
                                items: [
                                    {
                                        xtype: 'samoswidgets-griditems',
                                        padding: '0',
                                        reference: 'financeiroscompra',
                                        qtdeLinhasMinima: 3,
                                        permitidoGridVazia: true,
                                        name: 'MOVIMENTOS_FINANCEIROSCOMPRA',
                                        idProperty: 'MOVIMENTOSFINANCEIROSCOMPRA_ID',
                                        descartarSeVazio: 'MOVIMENTOSFINANCEIROSCOMPRA_VCTO',
                                        bind: {
                                            store: '{financeiroscompra}'
                                        },
                                        fields: [
                                            { hidden: true, name: 'MOVIMENTOSFINANCEIROSCOMPRA_ID' },
                                            { hidden: true, name: 'MOVIMENTOSFINANCEIROSCOMPRA_ID_MOVIMENTOS' },
                                            {
                                                title: 'Vcto',
                                                name: 'MOVIMENTOSFINANCEIROSCOMPRA_VCTO',
                                                xtype: 'datefield',
                                                width : 120,
                                                align: 'center',
                                                bind: {
                                                    readOnly: '{readOnly}'
                                                }
                                            },
                                            {
                                                empty: true,
                                                title: 'Valor',
                                                name: 'MOVIMENTOSFINANCEIROSCOMPRA_VALOR',
                                                width : 90,
                                                xtype: 'samoswidgets-textmoney',
                                                bind: {
                                                    readOnly: '{readOnly}'
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }, {
                                xtype: 'container',
                                style: 'border:1px solid #c5c5c5 !important;',
                                margin: '10 0 10 10',
                                padding: '10 0 10 10',
                                defaultType: 'fieldcontainer',
                                layout: 'vbox',
                                width: 370,
                                items: [
                                    {
                                        items: [
                                            {
                                                width: 80,
                                                fieldLabel: 'Despesas',
                                                reference: 'despesas',
                                                xtype: 'samoswidgets-textmoney',
                                                proximoFoco: 'seguro',
                                                bind: {
                                                    value: '{model.MOVIMENTOS_DESPESAS}',
                                                    readOnly: '{readOnly}'
                                                },
                                                listeners: {
                                                    change: 'calcularPedidoCompra'
                                                }
                                            },                                            
                                            {
                                                width: 80,
                                                fieldLabel: '% Desc',
                                                reference: 'percentualdescontos',
                                                mask: '#9.999.990,000',
                                                proximoFoco: 'seguro',
                                                xtype: 'samoswidgets-textmoney',
                                                bind: {
                                                    value: '{model.MOVIMENTOS_PERCENTUAL}',
                                                    readOnly: '{readOnly || isDescontoPorItem || digitouDescontoCabecalhoEmDinheiro || (isDescontoPorItemECabecalho && digitouDescontoItem)}',
                                                    ui: '{isDescontoPorItem || digitouDescontoCabecalhoEmDinheiro || (isDescontoPorItemECabecalho && digitouDescontoItem) ? "field-readonly" : "textbold-' + tema + '"}'
                                                },
                                                listeners: {
                                                    change: configs.getMovimentos().recalculoSync ? Ext.emptyFn : 'calcularTotaisCabecalho',
                                                    render: configs.getMovimentos().recalculoSync ? 'onUpdateField' : Ext.emptyFn
                                                }
                                            },
                                            {
                                                width: 80,
                                                fieldLabel: 'R$ Desc',
                                                reference: 'rsdescontos',
                                                xtype: 'samoswidgets-textmoney',
                                                proximoFoco: 'seguro',
                                                bind: {
                                                    value: '{model.MOVIMENTOS_DESCONTOS}',
                                                    readOnly: '{readOnly || isDescontoPorItem || digitouDescontoCabecalhoEmPercentual || (isDescontoPorItemECabecalho && digitouDescontoItem)}',
                                                    ui: '{isDescontoPorItem || digitouDescontoCabecalhoEmPercentual || (isDescontoPorItemECabecalho && digitouDescontoItem) ? "field-readonly" : "textbold-' + tema + '"}'
                                                },
                                                listeners: {
                                                    change: configs.getMovimentos().recalculoSync ? Ext.emptyFn : 'calcularTotaisCabecalho',
                                                    render: configs.getMovimentos().recalculoSync ? 'onUpdateField' : Ext.emptyFn
                                                }
                                            },
                                            {
                                                width: 90,
                                                fieldLabel: 'Produtos',
                                                reference: 'produtos_valor',
                                                proximoFoco: 'seguro',
                                                xtype: 'samoswidgets-textmoney',
                                                fieldStyle: 'color:green',
                                                readOnly: true,
                                                ui: 'field-readonly',
                                                bind: {
                                                    value: '{model.MOVIMENTOS_PRODUTOS}'
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        items: [
                                            {
                                                width: 80,
                                                fieldLabel: '% Seguro',
                                                reference: 'seguropercentual',
                                                xtype: 'samoswidgets-textmoney',
                                                proximoFoco: 'fretepercentual',
                                                bind: {
                                                    value: '{model.PERCENTUAL_SEGURO}',
                                                    readOnly: '{readOnly}'
                                                },
                                                listeners: {
                                                    change: 'calcularPedidoCompra'
                                                }
                                            },
                                            {
                                                width: 80,
                                                fieldLabel: '% Frete',
                                                reference: 'fretepercentual',
                                                xtype: 'samoswidgets-textmoney',
                                                proximoFoco: 'ipipercentual',
                                                bind: {
                                                    hidden: '{isPreVenda}',
                                                    value: '{model.PERCENTUAL_FRETE}',
                                                    readOnly: '{readOnly}'
                                                },
                                                listeners: {
                                                    change: 'calcularPedidoCompra'
                                                }
                                            },
                                            {
                                                width: 80,
                                                fieldLabel: 'R$ Frete',
                                                reference: 'fretevalor',
                                                xtype: 'samoswidgets-textmoney',
                                                proximoFoco: 'ipipercentual',
                                                bind: {
                                                    hidden: '{!isPreVenda}',
                                                    value: '{model.MOVIMENTOS_FRETE}',
                                                    readOnly: '{readOnly}'
                                                },
                                                listeners: {
                                                    change: 'calcularPedidoCompra'
                                                }
                                            },
                                            {
                                                width: 80,
                                                fieldLabel: '% Ipi',
                                                reference: 'ipipercentual',
                                                proximoFoco: 'produto0',
                                                xtype: 'samoswidgets-textmoney',
                                                bind: {
                                                    value: '{model.PERCENTUAL_IPI}',
                                                    readOnly: '{readOnly}'
                                                },
                                                listeners: {
                                                    change: 'calcularPedidoCompra'
                                                }
                                            },
                                            {
                                                width: 90,
                                                fieldLabel: 'Total',
                                                reference: 'total',
                                                xtype: 'samoswidgets-textmoney',
                                                fieldStyle: 'color:blue',
                                                proximoFoco: 'produto0',
                                                readOnly: true,
                                                ui: 'field-readonly',
                                                bind: {
                                                    value: '{model.MOVIMENTOS_TOTAL}'
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }] : [{
                                xtype: 'container',
                                style: 'border:1px solid #c5c5c5 !important;',
                                margin: '10 0 10 10',
                                padding: '10 0 10 10',
                                defaultType: 'fieldcontainer',
                                layout: 'vbox',
                                bind: {
                                    width: '{listName == "Transferências" ? 235 : 435}',
                                },
                                items: [
                                    {
                                        items: [
                                            {
                                                flex: false,
                                                width: 90,
                                                fieldLabel: 'Frete',
                                                reference: 'frete',
                                                xtype: 'samoswidgets-textmoney',
                                                bind: {
                                                    proximoFoco: '{isNotaEntrada ? "produtos_valor" : "seguro"}',
                                                    value: '{model.MOVIMENTOS_FRETE}',
                                                    readOnly: '{readOnly || boletoImpresso}',
                                                    ui: '{!boletoImpresso ? "textbold-' + tema + '" : "field-readonly"}'
                                                },
                                                listeners: {
                                                    change: configs.getMovimentos().recalculoSync ? Ext.emptyFn : 'fazerSomasERateios',
                                                    blur: configs.getMovimentos().recalculoSync ? Ext.emptyFn : 'fazerSomasERateios',
                                                    render: configs.getMovimentos().recalculoSync ? 'onUpdateField' : Ext.emptyFn
                                                }
                                            },
                                            {
                                                flex: false,
                                                width: 90,
                                                fieldLabel: '% Desc',
                                                reference: 'percentualdescontos',
                                                mask: '#9.999.990,000',
                                                proximoFoco: 'seguro',
                                                xtype: 'samoswidgets-textmoney',
                                                bind: {
                                                    hidden: '{listName == "Transferências"}',
                                                    value: '{model.MOVIMENTOS_PERCENTUAL}',
                                                    readOnly: '{readOnly || boletoImpresso|| isDescontoPorItem || digitouDescontoCabecalhoEmDinheiro || (isDescontoPorItemECabecalho && digitouDescontoItem)}',
                                                    ui: '{boletoImpresso || isDescontoPorItem || digitouDescontoCabecalhoEmDinheiro || (isDescontoPorItemECabecalho && digitouDescontoItem) ? "field-readonly" : "textbold-' + tema + '"}'
                                                },
                                                listeners: {
                                                    change: configs.getMovimentos().recalculoSync ? Ext.emptyFn : 'calcularTotaisCabecalho',
                                                    render: configs.getMovimentos().recalculoSync ? 'onUpdateField' : Ext.emptyFn
                                                }
                                            },
                                            {
                                                flex: false,
                                                width: 90,
                                                fieldLabel: 'R$ Desc',
                                                reference: 'rsdescontos',
                                                xtype: 'samoswidgets-textmoney',
                                                proximoFoco: 'seguro',
                                                bind: {
                                                    hidden: '{listName == "Transferências"}',
                                                    value: '{model.MOVIMENTOS_DESCONTOS}',
                                                    readOnly: '{readOnly || boletoImpresso || isDescontoPorItem || digitouDescontoCabecalhoEmPercentual || (isDescontoPorItemECabecalho && digitouDescontoItem)}',
                                                    ui: '{boletoImpresso || isDescontoPorItem || digitouDescontoCabecalhoEmPercentual || (isDescontoPorItemECabecalho && digitouDescontoItem) ? "field-readonly" : "textbold-' + tema + '"}'
                                                },
                                                listeners: {
                                                    change: configs.getMovimentos().recalculoSync ? Ext.emptyFn : 'calcularTotaisCabecalho',
                                                    render: configs.getMovimentos().recalculoSync ? 'onUpdateField' : Ext.emptyFn
                                                }
                                            },
                                            {
                                                flex: false,
                                                width: 120,
                                                fieldLabel: 'Produtos',
                                                reference: 'produtos_valor',
                                                proximoFoco: 'seguro',
                                                xtype: 'samoswidgets-textmoney',
                                                fieldStyle: 'color:green',
                                                bind: {                                                    
                                                    readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                                    ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                                    value: '{model.MOVIMENTOS_PRODUTOS}'
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        items: [
                                            {
                                                fieldLabel: configs.getMovimentos().usarMarkup ? 'Markup' : 'Seguro',                                                    
                                                flex: false,
                                                width: 90,
                                                reference: 'seguro',
                                                proximoFoco: 'despesas',
                                                xtype: 'samoswidgets-textmoney',
                                                bind: {
                                                    hidden: '{hideMarkup}',
                                                    value: '{model.MOVIMENTOS_SEGURO}',
                                                    readOnly: configs.getMovimentos().usarMarkup || '{readOnly || boletoImpresso}',
                                                    ui: '{!boletoImpresso ? "textbold-' + tema + '" : "field-readonly"}'
                                                },
                                                listeners: configs.getMovimentos().usarMarkup ? null : {
                                                    change: configs.getMovimentos().recalculoSync ? Ext.emptyFn : 'fazerSomasERateios',
                                                    render: configs.getMovimentos().recalculoSync ? 'onUpdateField' : Ext.emptyFn
                                                }
                                            },
                                            {
                                                flex: false,
                                                width: 90,
                                                fieldLabel: 'Peso Bruto',
                                                reference: 'pesobruto',
                                                proximoFoco: 'despesas',
                                                xtype: 'samoswidgets-textmoney',
                                                mask: '#9.999.990,000',
                                                readOnly: true,
                                                hidden: title == 'Transferências' || !configs.getMovimentos().exibirPesoMovimento,
                                                ui: 'field-readonly',
                                                bind: {
                                                    value: '{valorPesoBruto}'
                                                }
                                            },
                                            {
                                                flex: false,
                                                fieldLabel: 'Despesas',
                                                reference: 'despesas',
                                                xtype: 'samoswidgets-textmoney',
                                                bind: {
                                                    hidden: '{listName == "Transferências"}',
                                                    width: configs.getMovimentos().usarMarkup ? '{(isNotaEntrada || isPedido || isOrcamento) && hideMarkup ? 184 : 90}' : '{(isNotaEntrada || isNotaEletronica || isPedido || isOrcamento || isDevolucaoMoveis) ? 90 : 184}',
                                                    proximoFoco: '{isNotaEntrada ? "valorreal" : isNotaEletronica ? "operacaonota" : "produto0"}',
                                                    value: '{model.MOVIMENTOS_DESPESAS}',
                                                    readOnly: '{readOnly || boletoImpresso}',
                                                    ui: '{!boletoImpresso ? "textbold-' + tema + '" : "field-readonly"}'
                                                },
                                                listeners: {
                                                    change: configs.getMovimentos().recalculoSync ? Ext.emptyFn : 'fazerSomasERateios',
                                                    render: configs.getMovimentos().recalculoSync ? 'onUpdateField' : Ext.emptyFn
                                                }
                                            },
                                            {
                                                flex: false,
                                                width: 90,
                                                fieldLabel: (configs.getMovimentos().partida && configs.getMovimentos().partida.coeficiente) ? 'Partida' : configs.getMovimentos().exibirResultItens ? 'Result' : 'Fator',
                                                reference: 'fator',
                                                xtype: 'samoswidgets-textmoney',
                                                mask: (configs.getMovimentos().partida && configs.getMovimentos().partida.coeficiente) ? '#9.999.990,00' : '#9.999.990,000',
                                                readOnly: true,
                                                ui: 'field-readonly',
                                                proximoFoco: 'total',
                                                bind: {
                                                    value: (configs.getMovimentos().partida && configs.getMovimentos().partida.coeficiente) ? '{model.MOVIMENTOS_IMPOSTO}' : '{model.MOVIMENTOS_MARGEM}',
                                                    hidden: '{!isPedido && !isOrcamento && !isDevolucaoMoveis}'
                                                }
                                            },
                                            {
                                                flex: false,
                                                width: 90,
                                                fieldLabel: configs.getClientName().match(/racaforte|cirurcenter/) ? 'Desp Anexa' :
                                                            (configs.getClientName() == 'prudenmoveis' || 
                                                             configs.getClientName() == 'organoplant' ||
                                                             configs.getClientName() == 'biomart' ||
                                                             configs.getClientName() == 'pinguim') ? 'Financeiro' : 'Valor CT-e',
                                                reference: 'valorreal',
                                                proximoFoco: 'total',
                                                xtype: 'samoswidgets-textmoney',
                                                fieldStyle: 'color:blue',
                                                bind: {
                                                    hidden: '{listName != "Nota Entrada"}',
                                                    value: '{model.MOVIMENTOS_IMPOSTO}',
                                                    readOnly: '{readOnly}'
                                                },
                                                listeners: {
                                                    change: configs.getMovimentos().recalculoSync ? Ext.emptyFn : 'fazerSomasERateios',
                                                    render: configs.getMovimentos().recalculoSync ? 'onUpdateField' : Ext.emptyFn
                                                }
                                            },
                                            {
                                                flex: false,
                                                width: 90,
                                                fieldLabel: 'Vlr IRRF',
                                                reference: 'irrfretido',
                                                xtype: 'samoswidgets-textmoney',
                                                fieldStyle: 'color:blue',
                                                readOnly: true,
                                                ui: 'field-readonly',
                                                bind: {                   
                                                    hidden: '{!isNotaEletronica}',
                                                    value: '{model.MOVIMENTOS_VALORRETENCAO}'
                                                }
                                            },
                                            {
                                                flex: false,
                                                width: 90,
                                                fieldLabel: 'Vlr Subst',
                                                reference: 'subst',
                                                xtype: 'samoswidgets-textmoney',
                                                fieldStyle: 'color:blue',
                                                hidden: configs.getMovimentos().exibirPesoMovimento,
                                                bind: {
                                                    proximoFoco: '{isNotaEntrada ? "operacaonota" : "produto0"}',
                                                    readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                                    ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                                    value: '{model.MOVIMENTOS_VALORST}'
                                                }
                                            },
                                            {
                                                flex: false,
                                                width: 120,
                                                fieldLabel: 'Total',
                                                reference: 'total',
                                                xtype: 'samoswidgets-textmoney',
                                                fieldStyle: 'color:blue',
                                                bind: {
                                                    proximoFoco: '{isNotaEntrada ? "operacaonota" : "produto0"}',
                                                    readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                                    ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                                    value: '{model.MOVIMENTOS_TOTAL}'
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }]
                        )
                    ]
                },
                {
                    title: 'Operação',
                    ui: 'formpanel-noheader-' + tema,
                    bind: {
                        hidden: '{!isNota}'
                    },
                    items: [
                        {
                            items: [
                                {
//                                  width: 148,
                                    flex: false,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Operação',
                                    tabela: 'operacoes',
                                    reference: 'operacaonota',
                                    proximoFoco: 'nfe',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    associations: [
                                        ['MOVIMENTOS_ID_OPERACOES', 'OPERACOES_ID'],
                                        ['OPERACOES_NOME',          'OPERACOES_NOME'],
                                        ['OPERACOES_FINANCEIRO',    'OPERACOES_FINANCEIRO'],
                                        ['OPERACOES_FINALIDADE',    'OPERACOES_FINALIDADE'],
                                        ['OPERACOES_TIPO',          'OPERACOES_TIPO'],
                                        ['OPERACOES_ACAO',          'OPERACOES_ACAO'],
                                        ['OPERACOES_BAIXAVISTA',    'OPERACOES_BAIXAVISTA'],
                                        ['OPERACOES_ID_APLICACOES', 'OPERACOES_ID_APLICACOES'],
                                        ['OPERACOES_UNICA',         'OPERACOES_UNICA'],
                                        ['OPERACOES_COMPLEMENTAR',  'OPERACOES_COMPLEMENTAR'],
                                        ['MOVIMENTOS_ID_CUSTOS',    'OPERACOES_ID_CUSTOS'],
                                        ['CUSTOS_NOME',             'CUSTOS_NOME']
                                    ],
                                    bind: {
                                        width: '{isSimplesNacional ? 148 : 120}',
                                        value: '{model.MOVIMENTOS_ID_OPERACOES}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: 'onSairCampoOperacoes'
                                    },
                                    
                                },
                                {
                                    flex: false,
//                                  width: 451,
                                    reference: 'nomeoperacaonota',
                                    proximoFoco: 'nfe',
                                    fieldLabel: 'Descrição',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.OPERACOES_NOME}',
                                        width: '{isSimplesNacional ? 451 : 495}',
                                    }
                                },
                                {
                                    flex: 1.5,
                                    reference: 'nfe',
                                    fieldLabel: 'NFE',
                                    bind: {
                                        proximoFoco: '{isNotaEntrada ? "baseicms" : "protocolonota"}',
                                        readOnly: '{readOnly || !isNotaEntrada}',
                                        ui: '{!isNotaEntrada ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_NFE}'
                                    }
                                }
                            ]
                        },
                        { // Empresas do Simples Nacional
                            items: [
                                {
                                    width: 148,
                                    flex: false,
                                    fieldLabel: 'Base ICMS',
                                    reference: 'baseicms',
                                    proximoFoco: 'valoricms',
                                    fieldStyle:'color:blue',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_BASEICMS}'
                                    }
                                },
                                {
                                    width: 148,
                                    flex: false,
                                    fieldLabel: 'Valor ICMS',
                                    reference: 'valoricms',
                                    proximoFoco: 'basesubst',
                                    fieldStyle:'color:red;',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_VALORICMS}'
                                    }
                                },
                                {
                                    width: 148,
                                    flex: false,
                                    fieldLabel: 'Base Substituição',
                                    reference: 'basesubst',
                                    proximoFoco: 'valorsubst',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_BASEST}'
                                    }
                                },
                                {
                                    width: 148,
                                    flex: false,
                                    fieldLabel: 'Valor Substituição',
                                    reference: 'valorsubst',
                                    proximoFoco: 'valoripi',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_VALORST}'
                                    }
                                },
                                {
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Valor IPI',
                                    reference: 'valoripi',
                                    proximoFoco: 'protocolonota',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_VALORIPI}'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'protocolonota',
                                    proximoFoco: 'produto0',
                                    fieldLabel: 'Protocolo',
                                    bind: {
                                        readOnly: '{readOnly || !isNotaEntrada}',
                                        ui: '{!isNotaEntrada ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_PROTOCOLO}'
                                    },
                                    listeners: {
                                        blur: 'colapseDadosOperacaoNota'
                                    }
                                }
                            ],
                            bind: {
                                hidden: '{!isSimplesNacional}'
                            }
                        },
                        { // Empresas do Regime normal - Com campos IBS/CBS
                            items: [
                                {
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Base ICMS',
                                    reference: 'baseicms',
                                    proximoFoco: 'valoricms',
                                    fieldStyle:'color:blue',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_BASEICMS}'
                                    }
                                },
                                {
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Valor ICMS',
                                    reference: 'valoricms',
                                    proximoFoco: 'basesubst',
                                    fieldStyle:'color:red;',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_VALORICMS}'
                                    }
                                },
                                {
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Base IBS/CBS',
                                    reference: 'baseibscbs',
                                    proximoFoco: 'valoribs',
                                    fieldStyle:'color:blue',                                   
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_BASEIBSCBS}'
                                    }
                                },
                                {
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Valor IBS',
                                    reference: 'valoribs',
                                    proximoFoco: 'valorcbs',
                                    fieldStyle:'color:red;',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_VALORIBS}'
                                    }
                                },
                                {
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Valor CBS',
                                    reference: 'valorcbs',
                                    proximoFoco: 'basesubst',
                                    fieldStyle:'color:red;',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_VALORCBS}'
                                    }
                                },
                                {
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Base Substituição',
                                    reference: 'basesubst',
                                    proximoFoco: 'valorsubst',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_BASEST}'
                                    }
                                },
                                {
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Valor Substituição',
                                    reference: 'valorsubst',
                                    proximoFoco: 'valoripi',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_VALORST}'
                                    }
                                },
                                {
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Valor IPI',
                                    reference: 'valoripi',
                                    proximoFoco: 'protocolonota',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || (!isNotaEntrada && finalidadeNormal)}',
                                        ui: '{(!isNotaEntrada && finalidadeNormal) ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_VALORIPI}'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'protocolonota',
                                    proximoFoco: 'produto0',
                                    fieldLabel: 'Protocolo',
                                    bind: {
                                        readOnly: '{readOnly || !isNotaEntrada}',
                                        ui: '{!isNotaEntrada ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOS_PROTOCOLO}'
                                    },
                                    listeners: {
                                        blur: 'colapseDadosOperacaoNota'
                                    }
                                }
                            ],
                            bind: {
                                hidden: '{isSimplesNacional}'
                            }
                        }                        
                    ]
                },
                {
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'produtos',
                            qtdeLinhasMinima: 3,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            janelaDetalhes: ( ((title == 'Orçamentos' || title == 'Pedidos') && configs.getClientName() == 'prudenmoveis') || 
                                               (title == 'Orçamentos' && !configs.getClientName().match(/hospitalar|racaforte/))) ? {
                                handler: 'onDetalhesProdutoClick'
                            } : {
                                xtype: 'formmovimentosimpostositens',
                                validator: 'validaAberturaJanelaDetalhes',
                                ocultarBotao: '{!(isNotaEletronicaMTF || isOrcamentoRaca || isNotaEntrada || isRequisicaoEntrada || !finalidadeNormal || isPedidoCompra || isNotaProducao || isPedidoLote || isRequisicaoLote)}'
                            },
                            name: 'MOVIMENTOS_ITENS',
                            idProperty: 'MOVIMENTOSITENS_ID',
                            descartarSeVazio: 'MOVIMENTOSITENS_ID_PRODUTOS',
                            bind: {
                                store: '{produtos}'
                            },
                            listeners: configs.getMovimentos().recalculoSync ? 
                                {
                                    onUpdate: 'atualizarCalculos',
                                    aposPublicarModel: (title.match(/Compra/) ? 'calcularPedidoCompra' : Ext.emptyFn),
                                    aposAbrirJanelaDetalhes: 'setarDefaultsJanelaDetalhes'
                                } : 
                                {
                                    antesDePublicarModel: 'calcularProduto',
                                    aposPublicarModel: (title.match(/Compra/) ? 'calcularPedidoCompra' : 'fazerSomasERateios'),
                                    aposAbrirJanelaDetalhes: 'setarDefaultsJanelaDetalhes'
                                },
                            fields: [
                                { hidden: true, name: 'MOVIMENTOSITENS_ID' },
                                {
                                    title: 'Produto',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    valuePessoa: configs.getPessoas().precoEspecifico ? 'MOVIMENTOS_ID_PESSOAS' : null,
                                    buscarPor: 'Genérica',
                                    callbackFn: 'prepararProduto',
                                    name: 'MOVIMENTOSITENS_ID_PRODUTOS',
                                    hidden: !configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_ID_PRODUTOS'],
                                    bind: {
                                        readOnly: '{readOnly || boletoImpresso}'
                                    },
                                    associations:[
                                        ['MOVIMENTOSITENS_ID_PRODUTOS',   'PRODUTOS_ID'],
                                        ['PRODUTOS_ID',                   'PRODUTOS_ID'],
                                        ['PRODUTOS_STATUS',               'PRODUTOS_STATUS'],
                                        ['PRODUTOS_NOME',                 'PRODUTOS_NOME'],
                                        ['PRODUTOS_UNIDADE',              'PRODUTOS_UNIDADE'],
                                        ['PRODUTOS_MARCA',                'PRODUTOS_MARCA'],
                                        ['PRODUTOS_APLICACAO',            'PRODUTOS_APLICACAO'],
                                        ['PRODUTOS_FABRICA',              'PRODUTOS_FABRICA'],
                                        ['PRODUTOS_DERIVADO',             'PRODUTOS_DERIVADO'],
                                        ['PRODUTOS_EDITAVEL',             'PRODUTOS_EDITAVEL'],                                        
                                        ['PRODUTOS_DESCRICAO',            'PRODUTOS_DESCRICAO'],
                                        ['PRODUTOS_PESOLIQUIDO',          'PRODUTOS_PESOLIQUIDO'],
                                        ['PRODUTOS_PESOBRUTO',            'PRODUTOS_PESOBRUTO'],
                                        ['PRODUTOS_ID_GRUPOS',            'PRODUTOS_ID_GRUPOS'],
                                        ['PRODUTOS_LISTAPRECO',           'PRODUTOS_LISTAPRECO'],
                                        ['MOVIMENTOSITENS_CUSTO',         'SALDOS_CUSTO'],
                                        ['MOVIMENTOSITENS_VALORCOFINSST', 'SALDOS_TRANSFERENCIA'],                                        
                                        ['NOVO_PRECO',                    'SALDOS_COMPRA'],
                                        ['SALDOS_MARGEM',                 'SALDOS_MARGEM'],
                                        ['SALDOS_CUSTO',                  'SALDOS_CUSTO'],
                                        ['SALDOS_COMPRA',                 'SALDOS_COMPRA'],
                                        ['SALDOS_PRAZO',                  'SALDOS_PRAZO'],
                                        ['SALDOS_PRECO',                  'SALDOS_PRECO'],
                                        ['SALDOS_TRANSFERENCIA',          'SALDOS_TRANSFERENCIA'],
                                        ['SALDOS_PRECOMINIMO',            'SALDOS_PRECOMINIMO'],
                                        ['PRECOMINIMO_DB',                'PRECOMINIMO_DB'],
                                        ['SALDOS_COMISSAO',               'SALDOS_COMISSAO'],
                                        ['QTDE_PROMOCAO',                 'QTDE_PROMOCAO'],
                                        ['VALOR_PROMOCAO',                'VALOR_PROMOCAO'],
                                        ['VALOR_PROMOCAOA',               'VALOR_PROMOCAOA'],
                                        ['VALOR_PROMOCAOB',               'VALOR_PROMOCAOB'],
                                        ['VALOR_PROMOCAOC',               'VALOR_PROMOCAOC'],
                                        ['SALDOS_DISPONIVEL',             'SALDOS_DISPONIVEL'],
                                        ['SALDOS_DEPOSITO',               'SALDOS_DEPOSITO'],
                                        ['SALDOS_RESERVADO',              'SALDOS_RESERVADO'],
                                        ['SALDOS_CSTLOCAL',               'SALDOS_CSTLOCAL'],
                                        ['SALDOS_CSTOUTROS',              'SALDOS_CSTOUTROS'],
                                        ['SALDOS_CSTSUBST',               'SALDOS_CSTSUBST'],
                                        ['SALDOS_EXCECAO',                'SALDOS_EXCECAO'],
                                        ['SALDOS_IPI',                    'SALDOS_IPI'],
                                        ['SALDOS_ICMSLC',                 'SALDOS_ICMSLC'],
                                        ['SALDOS_ICMS01',                 'SALDOS_ICMS01'],
                                        ['SALDOS_ICMS02',                 'SALDOS_ICMS02'],
                                        ['SALDOS_BASELC',                 'SALDOS_BASELC'],
                                        ['SALDOS_BASE01',                 'SALDOS_BASE01'],
                                        ['SALDOS_BASE02',                 'SALDOS_BASE02'],
                                        ['SALDOS_BENEFICIOLC',            'SALDOS_BENEFICIOLC'],
                                        ['SALDOS_BENEFICIO01',            'SALDOS_BENEFICIO01'],
                                        ['SALDOS_BENEFICIO02',            'SALDOS_BENEFICIO02'],
                                        ['SALDOS_LOCAL',                  'SALDOS_LOCAL'],
                                        ['SALDOS_ALIQUOTASUBST',          'SALDOS_ALIQUOTASUBST'],
                                        ['NCMS_STATUS',                   'NCMS_STATUS'],                                        
                                        ['NCMS_NCM',                      'NCMS_NCM'],
                                        ['NCMS_ALIQUOTANACIONAL',         'NCMS_ALIQUOTANACIONAL'],
                                        ['NCMS_ALIQUOTAESTADUAL',         'NCMS_ALIQUOTAESTADUAL'],
                                        ['NCMS_ALIQUOTAIMPORTADO',        'NCMS_ALIQUOTAIMPORTADO'],
                                        ['NCMS_ALIQUOTAMUNICIPAL',        'NCMS_ALIQUOTAMUNICIPAL'],
                                        ['NCMS_CSTPIS',                   'NCMS_CSTPIS'],
                                        ['NCMS_CSTCOFINS',                'NCMS_CSTCOFINS'],
                                        ['NCMS_ALIQUOTAPIS',              'NCMS_ALIQUOTAPIS'],
                                        ['NCMS_ALIQUOTACOFINS',           'NCMS_ALIQUOTACOFINS'],
                                        ['NCMS_ALIQUOTAFCP',              'NCMS_ALIQUOTAFCP'],
                                        ['NCMS_DIFAL',                    'NCMS_DIFAL'],
                                        ['NCMS_CEST',                     'NCMS_CEST'],
                                        ['MONTAGENS_VALOR',               'PRECO_MONTAGEM'],
                                        ['OPERACOES_ICMS',                'OPERACOES_ICMS'],
                                        ['OPERACOES_ST',                  'OPERACOES_ST']
                                    ]
                                },
                                {
                                    title: 'Fábrica',
                                    hidden: !configs.getMovimentos().gridProdutos['PRODUTOS_FABRICA'],
                                    width: 100,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_FABRICA',
                                    readOnly: true
                                },
                                {
                                    title: 'Nome',
                                    reference: 'nomedoProduto',
                                    hidden: !configs.getMovimentos().gridProdutos['PRODUTOS_NOME'],
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    maxLength: 100,                                    
                                    proximoFoco: 'movimentositensquantidade',                                    
                                    bind: {
                                        readOnly: true // -> controlado pelo PRODUTOS_DERIVADO na hora que busca o produto
                                    }
                                },
                                {
                                    title: 'Uni',
                                    hidden: !configs.getMovimentos().gridProdutos['PRODUTOS_UNIDADE'],
                                    width: 50,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_UNIDADE',
                                    readOnly: true
                                },
                                {
                                    title: configs.getProdutos().labelMarca,
                                    hidden: !configs.getMovimentos().gridProdutos['PRODUTOS_MARCA'],
                                    width: 110,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_MARCA',
                                    readOnly: true
                                },
                                {
                                    title: configs.getProdutos().labelAplicacao,
                                    hidden: !configs.getMovimentos().gridProdutos['PRODUTOS_APLICACAO'],
                                    width: 110,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_APLICACAO',
                                    readOnly: true
                                },
                                {
                                    title: 'Local',
                                    hidden: !configs.getMovimentos().gridProdutos['SALDOS_LOCAL'],                                    
                                    name: 'SALDOS_LOCAL',
                                    width: 90,
                                    xtype: 'textfield',
                                    readOnly: true,
                                    fieldStyle: {
                                        textAlign: 'center'
                                    }
                                },
                                {
                                    title: 'Saldo',
                                    name: 'SALDOS_DISPONIVEL',
                                    width: 60,
                                    xtype: 'numberfield',                                    
                                    readOnly: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {
                                        hidden: configs.getMovimentos().recalculoSync ? true : '{hideSaldo}'
                                    }
                                },
                                ...(title == 'Transferências' ? [{
                                    title: 'Tipo',
                                    name: 'MOVIMENTOSITENS_EXCECAO',
                                    xtype: 'combobox',
                                    displayField: 'field2',
                                    store: [
                                        ['P', 'PV'],
                                        ['L', 'LJ']
                                    ],
                                    width: 80,
                                    reference: 'abastecimento',
                                    forceSelection: true,
                                    editable: false,
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                }] : []),

                                ...(configs.getClientName() == 'turbotec' ? [{
                                    title: 'Dv Casco',
                                    name: 'MOVIMENTOSITENS_ESCRITURACAO',
                                    xtype: 'combobox',
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'SIM'],
                                        ['2', 'NÃO'],
                                        ['0', 'PSC']
                                    ],
                                    width: 80,
                                    reference: 'cascoitem',
                                    forceSelection: true,
                                    editable: false,
                                    bind: {
                                        hidden: '{!(isPedido || isNotaEletronica)}',
                                        readOnly: '{readOnly}'
                                    }
                                }] : []),
                                {
                                    name: 'MOVIMENTOSITENS_QUANTIDADE',
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    hidden: !configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_QUANTIDADE'],
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    listeners: {
                                        blur: 'validarQtdeMaxima'
                                    },
                                    bind: {    
                                        title: '{isDevolucao ? "Devolvido" : "Qtde"}',                                                                            
                                        width: '{isDevolucao ? "100" : "60"}',                                                                            
                                        clicarNoProximoFoco: '{!permitidoAlterarPreco && isDescontoCabecalho && !finalidadeNormal}',
                                        proximoFoco: `{
                                            permitidoAlterarPreco ? 
                                            "movimentositenspreco" : 
                                            isDescontoPorItem ? 
                                            "dsc" : 
                                            isDescontoPorItemECabecalho ?
                                                digitouDescontoCabecalho ? 
                                                "produto[linhadebaixo]" : 
                                                "dsc" :
                                            !finalidadeNormal ? 
                                            "janelaDetalhesButton" : 
                                            "produto[linhadebaixo]"
                                        }`,
                                        readOnly: '{readOnly || boletoImpresso}'
                                    }
                                },
                                {
                                    empty: true,
                                    name: 'MOVIMENTOSITENS_PRECO',
                                    width: 120,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,' + ('0'.repeat(configs.getMovimentos().casasDecimaisPreco || 2)),
                                    hidden: !configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_PRECO'],
                                    listeners: {
                                        blur: configs.getMovimentos().recalculoSync ? 'atualizarCalculos' : 'validarAlteracaoPrecoItem'
                                    },
                                    bind: {
                                        title: '{isNotaEntrada ? "Valor Un." : "Preço"}',
                                        clicarNoProximoFoco: '{isDescontoCabecalho && !isNotaEntrada && !finalidadeNormal}',
                                        proximoFoco: `{
                                            isDescontoPorItem ? 
                                            "dsc" : 
                                            isDescontoPorItemECabecalho ?
                                                digitouDescontoCabecalho ? 
                                                "produto[linhadebaixo]" : 
                                                "dsc" :
                                            isNotaEntrada ? 
                                            readOnlyTotalLiquido ? 
                                            "produto[linhadebaixo]" :
                                            "totLiquido" : 
                                            !finalidadeNormal ? 
                                            "janelaDetalhesButton" : 
                                            "produto[linhadebaixo]"
                                        }`,
                                        readOnly: '{readOnly || boletoImpresso || !permitidoAlterarPreco}'
                                    }
                                },
                                {
                                    title: '% Dsc',
                                    name: 'MOVIMENTOSITENS_PERCENTUAL',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: configs.getMovimentos().percentualInteiro ? '#90' : '#9.999.990,000',
                                    empty: true,
                                    listeners: {
                                        blur: configs.getMovimentos().recalculoSync ? 'atualizarCalculos' : 'validarDescontoItem'
                                    },
                                    bind: {
                                        clicarNoProximoFoco: '{!isNotaEntrada && !finalidadeNormal}',
                                        proximoFoco: configs.getClientName() == 'racaforte' ? 'vlrLiquido' : configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_DESCONTOS'] ? 
                                            'totLiquido' : `{
                                                isNotaEntrada ? 
                                                "total" : 
                                                !finalidadeNormal ? 
                                                "janelaDetalhesButton" : 
                                                "produto[linhadebaixo]"
                                            }`,
                                        width: '{isDescontoCabecalho ? 0 : 70}',
                                        readOnly: '{readOnly || boletoImpresso || isDescontoCabecalho || (isDescontoPorItemECabecalho && digitouDescontoCabecalho)}',
                                        hidden: configs.getMovimentos().recalculoSync ? !configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_PERCENTUAL'] : configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_PERCENTUAL'] ? '{isNotaEntrada || isDescontoCabecalho}' : true
                                    }
                                },
                                {
                                    title: 'Vlr Dsc',
                                    name: 'MOVIMENTOSITENS_DESCONTOS',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,00',
                                    empty: true,
                                    listeners: {
                                        blur: configs.getMovimentos().recalculoSync ? 'atualizarCalculos' : 'validarDescontoItem'
                                    },
                                    bind: {
                                        proximoFoco: configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_LIQUIDO'] ?
                                            'vlrLiquido' :
                                            `{
                                                !readOnlyTotalLiquido ? 
                                                "totLiquido" : 
                                                isNotaEntrada ?
                                                "total" : 
                                                !finalidadeNormal ? 
                                                "janelaDetalhesButton" : 
                                                "produto[linhadebaixo]"
                                            }`,
                                        readOnly: '{readOnly || boletoImpresso || isDescontoCabecalho || (!isNotaEntrada && isDescontoPorItemECabecalho && digitouDescontoCabecalho)}',
                                        hidden: configs.getMovimentos().recalculoSync ? !configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_DESCONTOS'] : configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_DESCONTOS'] ? '{isDescontoCabecalho || isPedOrcStilo}' : true,
                                        width: '{isDescontoCabecalho ? 0 : 85}',
                                    }
                                },
                                {
                                    title: 'Total',
                                    name: 'MOVIMENTOSITENS_TOTAL',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    bind: {
                                        hidden: configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_TOTAL'] ? '{!isDescontoCabecalho}' : true,
                                        clicarNoProximoFoco: '{isNotaEntrada || isRequisicaoEntrada || !finalidadeNormal}',
                                        proximoFoco: '{(isNotaEntrada || isRequisicaoEntrada || !finalidadeNormal) ? "janelaDetalhesButton" : "produto[linhadebaixo]"}',
                                        readOnly: '{readOnly || boletoImpresso || (isNotaEntrada && !!model.MOVIMENTOS_NFE) || (!isNotaEntrada && !isNotaLislais && !isRequisicaoEntrada)}',
                                    }
                                },
                                {
                                    title: 'Vlr Líquido',
                                    name: 'VALOR_LIQUIDO',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    listeners: configs.getMovimentos().recalculoSync ? null : {
                                        blur: 'validarLiquidoItem'
                                    },
                                    bind: {
                                        proximoFoco: `{
                                            !readOnlyTotalLiquido ? 
                                            "totLiquido" : 
                                            "produto[linhadebaixo]"
                                        }`,
                                        hidden: configs.getMovimentos().recalculoSync ? !configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_LIQUIDO'] : configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_LIQUIDO'] ? '{isDescontoCabecalho}' : true,
                                        readOnly: '{readOnly || boletoImpresso || (isDescontoPorItemECabecalho && digitouDescontoCabecalho)}'
                                    }
                                },
                                {
                                    title: 'Tot Líquido',
                                    name: 'TOTAL_LIQUIDO',
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'produto[linhadebaixo]',
                                    listeners: configs.getMovimentos().recalculoSync ? null : {
                                        blur: 'validarLiquidoItem'
                                    },
                                    bind: {
                                        readOnly: '{readOnly || boletoImpresso || readOnlyTotalLiquido || isDescontoCabecalho || (isDescontoPorItemECabecalho && digitouDescontoCabecalho)}',
                                        width: '{isNotaEntrada || isDescontoCabecalho ? 0 : 100}',
                                        hidden: configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_TOTALLIQUIDO'] ? '{isNotaEntrada || isDescontoCabecalho}' : true
                                    }
                                },
                                {
                                    title: 'Result',
                                    name: 'MOVIMENTOSITENS_MARGEM',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    empty: true,
                                    readOnly: true,
                                    width: 80,
                                    bind: {
                                        hidden: configs.getMovimentos().recalculoSync ? !configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_MARGEM'] : configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_MARGEM']? '{!isPedido && !isOrcamento}' : true
                                    }
                                },
                                {
                                    title: 'Markup',
                                    name: 'MOVIMENTOSITENS_SEGURO',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    empty: true,
                                    readOnly: true,
                                    width: 80,
                                    bind: {
                                        hidden: '{hideMarkup}'
                                    }
                                },
                                {
                                    title: 'Custo',
                                    name: 'TOTAL_CUSTO',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,00',
                                    empty: true,
                                    readOnly: true,
                                    width: 100,
                                    bind: {
                                        hidden: '{hideCusto}'
                                    }
                                },
                                {
                                    title: 'Dev.',
                                    name: 'ITENS_DEVOLUCAO',
                                    xtype: 'checkbox',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        width: '{isDevolucao ? 80 : 0}',
                                        hidden: '{!isDevolucao}'
                                    }
                                },
                                { hidden: true, name: 'ROMANEIOSENTREGA_NUMERO' },
                                { hidden: true, name: 'ROMANEIOSENTREGA_NOME' },
                                { hidden: true, name: 'ROMANEIOSMONTAGEM_NUMERO' },
                                { hidden: true, name: 'ROMANEIOSMONTAGEM_NOME' },
                                { hidden: true, name: 'SALDOS_MARGEM' },
                                { hidden: true, name: 'SALDOS_CUSTO' },
                                { hidden: true, name: 'SALDOS_COMPRA' },
                                { hidden: true, name: 'SALDOS_PRAZO' },
                                { hidden: true, name: 'SALDOS_PRECO' },
                                { hidden: true, name: 'SALDOS_PRECOMINIMO' },
                                { hidden: true, name: 'PRECOMINIMO_DB' },
                                { hidden: true, name: 'SALDOS_COMISSAO' },
                                { hidden: true, name: 'SALDOS_TRANSFERENCIA' },
                                { hidden: true, name: 'QTDE_PROMOCAO' },
                                { hidden: true, name: 'VALOR_PROMOCAO' },
                                { hidden: true, name: 'VALOR_PROMOCAOA' },
                                { hidden: true, name: 'VALOR_PROMOCAOB' },
                                { hidden: true, name: 'VALOR_PROMOCAOC' },                                
                                { hidden: true, name: 'SALDOS_DEPOSITO' },
                                { hidden: true, name: 'SALDOS_RESERVADO' },
                                { hidden: true, name: 'SALDOS_CSTLOCAL' },
                                { hidden: true, name: 'SALDOS_CSTOUTROS' },
                                { hidden: true, name: 'SALDOS_CSTSUBST' },
                                { hidden: true, name: 'SALDOS_EXCECAO' },
                                { hidden: true, name: 'SALDOS_ALIQUOTASUBST' },
                                { hidden: true, name: 'SALDOS_IPI' },
                                { hidden: true, name: 'SALDOS_ICMSLC' },
                                { hidden: true, name: 'SALDOS_ICMS01', reference: 'saldosicmsA'  },
                                { hidden: true, name: 'SALDOS_ICMS02', reference: 'saldosicmsB'  },
                                { hidden: true, name: 'SALDOS_BASELC' },
                                { hidden: true, name: 'SALDOS_BASE01', reference: 'saldosbaseA' },
                                { hidden: true, name: 'SALDOS_BASE02', reference: 'saldosbaseB' },
                                { hidden: true, name: 'SALDOS_BENEFICIOLC' },
                                { hidden: true, name: 'SALDOS_BENEFICIO01' },
                                { hidden: true, name: 'SALDOS_BENEFICIO02' },
                                { hidden: true, name: 'PRODUTOS_DESCRICAO'},
                                { hidden: true, name: 'PRODUTOS_ID' },                                
                                { hidden: true, name: 'PRODUTOS_STATUS' },
                                { hidden: true, name: 'PRODUTOS_DERIVADO', reference: 'derivado' },
                                { hidden: true, name: 'PRODUTOS_EDITAVEL', reference: 'editavel' },
                                { hidden: true, name: 'PRODUTOS_PESOLIQUIDO' },
                                { hidden: true, name: 'PRODUTOS_PESOBRUTO' },
                                { hidden: true, name: 'PRODUTOS_ID_GRUPOS' },
                                { hidden: true, name: 'PRODUTOS_LISTAPRECO' },
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
                                { hidden: true, name: 'NCMS_DIFAL' },
                                { hidden: true, name: 'NCMS_CEST' },
                                { hidden: true, name: 'MOVIMENTOSITENS_ID_OPERACOES' },
                                { hidden: true, name: 'OPERACOES_NOME' },
                                { hidden: true, name: 'OPERACOES_ICMS' },
                                { hidden: true, name: 'OPERACOES_ST' },
                                { hidden: true, name: 'MOVIMENTOSITENS_CUSTO' },
                                { hidden: true, name: 'MOVIMENTOSITENS_IMPOSTO' },
                                { hidden: true, name: 'MOVIMENTOSITENS_ALIQUOTAPIS' },
                                { hidden: true, name: 'MOVIMENTOSITENS_CST' },
                                { hidden: true, name: 'TABELA_ORIGEM' },
                                { hidden: true, name: 'TABELA_LOCAL' },
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
                                { hidden: true, name: 'MOVIMENTOSITENS_VALORST' },
                                { hidden: true, name: 'MOVIMENTOSITENS_BASEST' },
                                { hidden: true, name: 'MOVIMENTOSITENS_IPI' },
                                { hidden: true, name: 'MOVIMENTOSITENS_VALORIPI' },
                                { hidden: true, name: 'MOVIMENTOSITENS_DESPESAS' },
                                { hidden: true, name: 'MOVIMENTOSITENS_ID_LOTES' },
                                { hidden: true, name: 'MOVIMENTOSITENS_ENTREGUE' },
                                { hidden: true, name: 'MOVIMENTOSITENS_IMEDIATA' },
                                { hidden: true, name: 'MOVIMENTOSITENS_DEPOSITO' },
                                { hidden: true, name: 'MOVIMENTOSITENS_ID_EMPRESAS' },
                                { hidden: true, name: 'LOTES_REFERENCIA' },
                                { hidden: true, name: 'LOTES_FABRICACAO' },                                
                                { hidden: true, name: 'LOTES_VALIDADE' },
                                { hidden: true, name: 'MOVIMENTOSITENS_DATAMONTAGEM' },
                                { hidden: true, name: 'MOVIMENTOSITENS_DATAENTREGA' },
                                { hidden: true, name: 'MOVIMENTOSITENS_HORAENTREGA' },
                                { hidden: true, name: 'MOVIMENTOSITENS_HORAMONTAGEM' },
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
        });
        
        this.callParent(arguments);

        if(!configs.getEmpresa().regimeCaixa || title == 'Orçamentos') {
            const btn = this.down('button[text="Caixa"]');
            btn.setText('Pagamento');
        }
    }
});
