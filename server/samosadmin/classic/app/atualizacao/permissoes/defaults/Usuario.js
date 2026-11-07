Ext.define('SamosAdmin.atualizacao.permissoes.defaults.Usuario', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'text',

    fields: [
        {
            name: 'children',
            defaultValue: [
                {
                    text: 'Atualização',
                    iconCls: 'x-fa fa-folder',
                    children: [
                        {
                            text: 'Pessoas',
                            module: 'pessoas',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Produtos',
                            module: 'produtos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Grupos',
                            module: 'grupos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Portadores',
                            module: 'portadores',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Transportes',
                            module: 'transportes',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Aplicações',
                            module: 'aplicacoes',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Centros Custo',
                            module: 'custos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Bancos',
                            module: 'bancos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Operadoras',
                            module: 'operadoras',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Ncms',
                            module: 'ncms',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Documentos',
                            module: 'documentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Operações',
                            module: 'operacoes',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Regra Fiscal',
                            module: 'regrafiscal',
                            read: 'T',
                            create: 'F',
                            update: 'F',
                            destroy: 'F'
                        },
                        {
                            text: 'Prazos',
                            module: 'prazos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Relações',
                            module: 'relacoes',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Lotes',
                            module: 'lotes',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Serviços',
                            module: 'servicos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Veículos',
                            module: 'veiculos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Montagens',
                            module: 'montagens',
                            read: 'T',
                            create: 'F',
                            update: 'F',
                            destroy: 'F'
                        },
                        {
                            text: 'Cidades',
                            module: 'cidades',
                            read: 'F',
                            create: 'F',
                            update: 'F',
                            destroy: 'F'
                        },
                        {
                            text: 'Convênios',
                            module: 'convenios',
                            read: 'F',
                            create: 'F',
                            update: 'F',
                            destroy: 'F'
                        }
                    ]
                },
                {
                    text: 'Movimentos',
                    iconCls: 'x-fa fa-folder',
                    children: [
                        {
                            text: 'Orçamentos',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Pedidos',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Requisições',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Devoluções',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Transferências',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Coletas',
                            module: 'coletas',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Romaneio Carga',
                            module: 'romaneios',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },                        
                        {
                            text: 'Romaneio Entrega',
                            module: 'romaneios',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Romaneio Montagem',
                            module: 'romaneios',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        ...(configs.getClientName() === 'acomtf' ? [{
                            text: 'Ordem Serviço MTF',
                            module: 'ordensacomtf',
                            read: 'T',
                            create: 'T',
                            update: 'F',
                            destroy: 'F'
                        }] : []),                        
                        ...(configs.getClientName() === 'fumya' ? [{
                            text: 'Ordem Serviço FUMYA',
                            module: 'ordensfumya',
                            read: 'T',
                            create: 'T',
                            update: 'F',
                            destroy: 'F'
                        }] : []),                        
                        ...(configs.getClientName() === 'eleve' ? [{
                            text: 'Ordem Serviço ELEVE',
                            module: 'ordenseleve',
                            read: 'T',
                            create: 'T',
                            update: 'F',
                            destroy: 'F'
                        }] : []),
                        ...(configs.getClientName() === 'cirurcenter' ? [{
                            text: 'Ordem Serviço CIRURCENTER',
                            module: 'ordenseleve',
                            read: 'T',
                            create: 'T',
                            update: 'F',
                            destroy: 'F'
                        }] : []),
                        {
                            text: 'Ordem Serviço',
                            module: 'ordens',
                            read: 'T',
                            create: 'T',
                            update: 'F',
                            destroy: 'F'
                        },
                        {
                            text: 'Ordem Produção',
                            module: 'ordensproducao',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Ordem Serviço Móveis',
                            module: 'ordensmoveis',
                            read: 'T',
                            create: 'T',
                            update: 'F',
                            destroy: 'F'
                        },
                        {
                            text: 'Ordem Serviço Veículos',
                            module: 'ordensveiculos',
                            read: 'T',
                            create: 'T',
                            update: 'F',
                            destroy: 'F'
                        },
                        {
                            text: 'Ordem Serviço Turbos',
                            module: 'ordensturbos',
                            read: 'T',
                            create: 'T',
                            update: 'F',
                            destroy: 'F'
                        },
                        {
                            text: 'Nota Eletrônica',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Cupom Eletrônico',
                            module: 'cupomeletronico',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Nota Consumidor',
                            module: 'notaconsumidor',
                            read: 'F',
                            create: 'F',
                            update: 'F',
                            destroy: 'F'
                        },
                        {
                            text: 'Nota Serviços',
                            module: 'notaservicos',
                            read: 'F',
                            create: 'F',
                            update: 'F',
                            destroy: 'F'
                        },
                        {
                            text: 'Manifestos',
                            module: 'manifestos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Conhecimento',
                            module: 'conhecimento',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Nota Entrada',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Caixa Diário',
                            module: 'caixa',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },           
                        {
                            text: 'Solicitação Compra',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }, 
                        {
                            text: 'Pedidos Compra',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }, 
                        {
                            text: 'Pré-vendas',
                            module: 'movimentos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Encomendas',
                            module: 'encomendas',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Promoções',
                            module: 'promocoes',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Telemarketing',
                            module: 'telemarketing',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Notificações',
                            module: 'notificacao',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }
                    ]
                },
                {
                    text: 'Consultas',
                    iconCls: 'x-fa fa-folder',
                    children: [
                        {
                            text: 'Preço de Produtos',
                            module: 'precoproduto',
                            read: 'T'
                        },
                        {
                            text: 'Lousa',
                            module: 'lousa',
                            read: 'T'
                        },
                        {
                            text: 'Kardex de Produtos',
                            module: 'kardex',
                            read: 'T'
                        },
                        {
                            text: 'Vendas por Pessoa',
                            module: 'comprasvendaspessoa',
                            read: 'T'
                        },
                        {
                            text: 'Compras por Pessoa',
                            module: 'comprasvendaspessoa',
                            read: 'T'
                        },
                        {
                            text: 'Vendas por Produto',
                            module: 'comprasvendasproduto',
                            read: 'T'
                        },
                        {
                            text: 'Pendências Pessoa',
                            module: 'pendencias',
                            read: 'T'
                        },
                        {
                            text: 'Pendências Produto',
                            module: 'pendenciasproduto',
                            read: 'T'
                        },
                        {
                            text: 'Compras por Produto',
                            module: 'comprasvendasproduto',
                            read: 'T'
                        },
                        {
                            text: 'Vendas por Lote',
                            module: 'comprasvendaslote',
                            read: 'T'
                        },
                        {
                            text: 'Compras por Lote',
                            module: 'comprasvendaslote',
                            read: 'T'
                        },
                        {
                            text: 'Gráfico Produtos',
                            module: 'graficoproduto',
                            read: 'T'
                        },
                        {
                            text: 'Logs de Usuários',
                            module: 'logsusuarios',
                            read: 'F'
                        }
                    ]
                },
                {
                    text: 'Financeiro',
                    iconCls: 'x-fa fa-folder',
                    children: [
                        {
                            text: 'Receber',
                            module: 'samosfinanceiros-titulos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Pagar',
                            module: 'samosfinanceiros-titulos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }, {
                            text: 'Baixa Receber',
                            module: 'samosfinanceiros-renegociacao',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }, {
                            text: 'Baixa Pagar',
                            module: 'samosfinanceiros-renegociacao',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Conta Corrente',
                            module: 'samosfinanceiros-contacorrentes',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }, 
                        {
                            text: 'Caixa Redesat',
                            module: 'samosfinanceiros-caixaredesat',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }, 
                        {
                            text: 'Boletos',
                            module: 'samosfinanceiros-boletos',
                            read: 'T'
                        }, 
                        {
                            text: 'Duplicatas',
                            module: 'samosfinanceiros-duplicatas',
                            read: 'T'                            
                        }, 
                        {
                            text: 'Carnês',
                            module: 'samosfinanceiros-carnes',
                            read: 'T'                    
                        }, 
                        {
                            text: 'Recibos',
                            module: 'samosfinanceiros-recibos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }, 
                        {
                            text: 'Remessas de Títulos',
                            module: 'samosfinanceiros-remessas',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Retorno',
                            module: 'samosfinanceiros-retorno',
                            read: 'T',
                            update: 'T'
                        },
                        {
                            text: 'Cartões',
                            module: 'samosfinanceiros-cartoes',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Cheques',
                            module: 'samosfinanceiros-cheques',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }, 
                        {
                            text: 'Remessas de Cheques',
                            module: 'samosfinanceiros-remessascheques',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Créditos',
                            module: 'samosfinanceiros-creditos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }                        
                    ]
                },
                {
                    text: 'Relatórios',
                    iconCls: 'x-fa fa-folder',
                    children: [
                        {
                            text: 'Produtos',
                            module: 'relatoriosprodutos',
                            read: 'F'
                        },
                        {
                            text: 'Pessoas',
                            module: 'relatoriospessoas',
                            read: 'F'
                        },

                        {
                            text: 'Financeiro',
                            module: 'relatoriosfinanceiro',
                            read: 'F'
                        },
                        {
                            text: 'Baixas Financeiro',
                            module: 'relatoriosbaixas',
                            isWindow: true,                            
                            read: 'F'
                        },
                        {
                            text: 'Fiscais',
                            module: 'relatoriosfiscais',
                            read: 'F'
                        },
                        {
                            text: 'Movimentos',
                            module: 'relatoriosmovimentos',
                            read: 'F'
                        },
                        {
                            text: 'Controle Casco',
                            module: 'relatorioscasco',
                            read: 'F'
                        },
                        {
                            text: 'Comissões',
                            module: 'relatorioscomissoes',
                            read: 'F'
                        },
                        {
                            text: 'Comissões Fin',
                            module: 'relatorioscomissoesfin',
                            read: 'F'
                        },
                        {
                            text: 'Comissões Pro',
                            module: 'relatorioscomissoespro',
                            read: 'F'
                        },
                        {
                            text: 'Ordens Serviço',
                            module: 'relatoriosordens',
                            read: 'F'
                        },
                        {
                            text: 'Lista de Preços',
                            module: 'relatoriosprecos',
                            read: 'F'
                        },
                        {
                            text: 'Movimento Produtos',
                            module: 'relatoriosmovimentoprodutos',
                            read: 'F'
                        },
                        {
                            text: 'Saldo Produtos',
                            module: 'relatoriossaldos',
                            read: 'F'
                        },
                        {
                            text: 'Produções',
                            module: 'relatoriosproducoes',
                            read: 'F'
                        },
                        {
                            text: 'Saldo Comparativo',
                            module: 'relatoriossaldoscomparativo',
                            read: 'F'
                        },
                        {
                            text: 'Venda Sintética',
                            module: 'relatoriosvendasintetica',
                            read: 'F'
                        },
                        {
                            text: 'Venda Analítica',
                            module: 'relatoriosvendaanalitica',
                            read: 'F'
                        },
                        {
                            text: 'Venda Pessoa',
                            module: 'relatoriosvendapessoa',
                            read: 'F'
                        },
                        {
                            text: 'Venda Fábrica',
                            module: 'relatoriosvendafabrica',
                            read: 'F'
                        },
                        {
                            text: 'Venda Vendedor',
                            module: 'relatoriosvendausuario',
                            read: 'F'
                        },
                        {
                            text: 'Venda Período',
                            module: 'relatoriosvendaperiodo',
                            read: 'F'
                        },
                        {
                            text: 'Venda Comparativa',
                            module: 'relatoriosvendacomparativa',
                            read: 'F'
                        },
                        {
                            text: 'Venda Tipo Recebimento',
                            module: 'relatoriosvendatipolist',
                            read: 'F'
                        },
                        {
                            text: 'Controle Bancário',
                            module: 'relatoriosextrato',
                            read: 'F'
                        },
                        {
                            text: 'Posição Financeira Bancos',
                            module: 'relatoriosbancos',
                            read: 'F'
                        },
                        {
                            text: 'Romaneios',
                            module: 'relatoriosromaneios',
                            read: 'F'
                        },
                        {
                            text: 'Resultados Caixa',
                            module: 'relatoriosresultados',
                            read: 'F'
                        },
                        {
                            text: 'Demonstrativo Resultados',
                            module: 'relatoriosdemonstrativo',
                            read: 'F'
                        },
                        {
                            text: 'Inventário Produtos',
                            module: 'relatoriosinventario',
                            read: 'F'
                        },
                        {
                            text: 'Compras Produtos',
                            module: 'relatorioscompras',
                            read: 'F'
                        },
                        {
                            text: 'Lucratividade',
                            module: 'relatorioslucratividade',
                            read: 'F'
                        },
                        {
                            text: 'Livro Produto Controlado',
                            module: 'relatorioslivrocontrolado',
                            read: 'F'
                        },
                        {
                            text: 'Fluxo de Caixa Sintético',
                            module: 'relatorioscaixasintetico',
                            read: 'F'
                        },
                        {
                            text: 'Vendas por Vendedor Sintética',
                            module: 'relatoriosvendasvendedorsintetica',
                            isWindow: true,
                            read: 'F'
                        },
                        {
                            text: 'Vendas por Vendedor Analítica',
                            module: 'relatoriosvendasvendedoranalitica',
                            isWindow: true,
                            read: 'F'
                        },
                        {
                            text: 'Vendas por Pessoa Sintética',
                            module: 'relatoriosvendaspessoassintetica',
                            isWindow: true,
                            read: 'F'
                        },
                        {
                            text: 'Vendas por Pessoa Analítica',
                            module: 'relatoriosvendaspessoasanalitica',
                            isWindow: true,
                            read: 'F'
                        },
                        {
                            text: 'Relatório Bancos',
                            module: 'relatorioscontascorrentes',
                            isWindow: true,
                            read: 'F'
                        },
                        {
                            text: 'Controle de Vacinas',
                            module: 'relatorioscontrolevacinas',
                            isWindow: true,
                            read: 'F'
                        },
                        {
                            text: 'Ressarcimento ST',
                            module: 'relatoriosressarcimentost',
                            isWindow: true,
                            read: 'F'
                        }
                    ]
                },
                {
                    text: 'Emissão',
                    iconCls: 'x-fa fa-folder',
                    children: [
                        {
                            text: 'Etiquetas Produtos',
                            module: 'emissaoetiquetas',
                            read: 'F'
                        },
                        {
                            text: 'Etiquetas Pessoas',
                            module: 'emissaoetiquetaspessoas',
                            read: 'F'
                        }
                    ]
                },
                {
                    text: 'Processos',
                    iconCls: 'x-fa fa-folder',
                    children: [
                        {
                            text: 'Sped Fiscal / PisCofins',
                            module: 'spedpiscofins',
                            read: 'F'
                        },
                        {
                            text: 'Sped Fiscal (Bloco K)',
                            module: 'spedblocok',
                            read: 'F'
                        },
                        {
                            text: 'CSV Preços',
                            module: 'csvprecos',
                            read: 'F'
                        },
                        {
                            text: 'Atualizar Preços',
                            module: 'processosprecos',
                            read: 'F'
                        },
                        {
                            text: 'Atualizar Estoque',
                            module: 'processosestoque',
                            read: 'F'
                        },
                        {
                            text: 'Ajustar Entradas',
                            module: 'processosentradas',
                            read: 'F'
                        },
                        {
                            text: 'XML Contabilidade',
                            module: 'xmlcontabilidade',
                            read: 'F'
                        },
                        {
                            text: 'CSV Contabilidade',
                            module: 'csvcontabilidade',
                            read: 'F'
                        },
                        {
                            text: 'CSV Inventário',
                            module: 'csvinventario',
                            read: 'F'
                        },
                        {
                            text: 'TXT Contabilidade',
                            module: 'txtcontabilidade',
                            read: 'F'
                        },
                        {
                            text: 'Gerar PDFs NF-e',
                            module: 'processosgerarpdfsnfe',
                            read: 'F'
                        },
                        {
                            text: 'Alterar Documentos',
                            module: 'processosalterardocumentos',
                            read: 'F'
                        },
                        {
                            text: 'Baixar Orçamentos',
                            module: 'baixarorcamentos',
                            read: 'F'
                        }
                    ]
                },
                {
                    text: 'Fale Conosco',
                    module: 'faleconosco',
                    isWindow: true,
                    iconCls: 'x-fa fa-comments',
                    read: 'T'
                }
            ]
        }
    ]
});
