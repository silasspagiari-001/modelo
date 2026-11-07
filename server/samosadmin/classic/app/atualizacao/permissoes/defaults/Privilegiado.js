Ext.define('SamosAdmin.atualizacao.permissoes.defaults.Privilegiado', {
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
                            text: 'Empresas',
                            module: 'empresas',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
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
                            text: 'Usuários',
                            module: 'usuarios',
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
                            create: 'T',
                            update: 'T',
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
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'T'
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
                            update: 'T',
                            destroy: 'F'
                        }] : []),                        
                        ...(configs.getClientName() === 'fumya' ? [{
                            text: 'Ordem Serviço FUMYA',
                            module: 'ordensfumya',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }] : []),                        
                        ...(configs.getClientName() === 'eleve' ? [{
                            text: 'Ordem Serviço ELEVE',
                            module: 'ordenseleve',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }] : []),
                        ...(configs.getClientName() === 'cirurcenter' ? [{
                            text: 'Ordem Serviço CIRURCENTER',
                            module: 'ordenseleve',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        }] : []),
                        {
                            text: 'Ordem Serviço',
                            module: 'ordens',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Ordem Produção',
                            module: 'ordensproducao',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'T'
                        },
                        {
                            text: 'Ordem Serviço Móveis',
                            module: 'ordensmoveis',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Ordem Serviço Veículos',
                            module: 'ordensveiculos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
                            destroy: 'F'
                        },
                        {
                            text: 'Ordem Serviço Turbos',
                            module: 'ordensturbos',
                            read: 'T',
                            create: 'T',
                            update: 'T',
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
                            destroy: 'T'
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
                            read: 'T'
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
                            destroy: 'T'
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
                            read: 'T'
                        },
                        {
                            text: 'Pessoas',
                            module: 'relatoriospessoas',
                            read: 'T'
                        },
                        {
                            text: 'Financeiro',
                            module: 'relatoriosfinanceiro',
                            read: 'T'
                        },
                        {
                            text: 'Baixas Financeiro',
                            module: 'relatoriosbaixas',
                            isWindow: true,                            
                            read: 'T'
                        },
                        {
                            text: 'Fiscais',
                            module: 'relatoriosfiscais',
                            read: 'T'
                        },
                        {
                            text: 'Movimentos',
                            module: 'relatoriosmovimentos',
                            read: 'T'
                        },
                        {
                            text: 'Controle Casco',
                            module: 'relatorioscasco',
                            read: 'T'
                        },
                        {
                            text: 'Comissões',
                            module: 'relatorioscomissoes',
                            read: 'T'
                        },
                        {
                            text: 'Comissões Fin',
                            module: 'relatorioscomissoesfin',
                            read: 'T'
                        },
                        {
                            text: 'Comissões Pro',
                            module: 'relatorioscomissoespro',
                            read: 'T'
                        },
                        {
                            text: 'Ordens Serviço',
                            module: 'relatoriosordens',
                            read: 'T'
                        },
                        {
                            text: 'Lista de Preços',
                            module: 'relatoriosprecos',
                            read: 'T'
                        },
                        {
                            text: 'Movimento Produtos',
                            module: 'relatoriosmovimentoprodutos',
                            read: 'T'
                        },
                        {
                            text: 'Saldo Produtos',
                            module: 'relatoriossaldos',
                            read: 'T'
                        },
                        {
                            text: 'Produções',
                            module: 'relatoriosproducoes',
                            read: 'T'
                        },
                        {
                            text: 'Saldo Comparativo',
                            module: 'relatoriossaldoscomparativo',
                            read: 'T'
                        },
                        {
                            text: 'Venda Sintética',
                            module: 'relatoriosvendasintetica',
                            read: 'T'
                        },
                        {
                            text: 'Venda Analítica',
                            module: 'relatoriosvendaanalitica',
                            read: 'T'
                        },
                        {
                            text: 'Venda Pessoa',
                            module: 'relatoriosvendapessoa',
                            read: 'T'
                        },
                        {
                            text: 'Venda Fábrica',
                            module: 'relatoriosvendafabrica',
                            read: 'T'
                        },
                        {
                            text: 'Venda Vendedor',
                            module: 'relatoriosvendausuario',
                            read: 'T'
                        },
                        {
                            text: 'Venda Período',
                            module: 'relatoriosvendaperiodo',
                            read: 'T'
                        },
                        {
                            text: 'Venda Comparativa',
                            module: 'relatoriosvendacomparativa',
                            read: 'T'
                        },
                        {
                            text: 'Venda Tipo Recebimento',
                            module: 'relatoriosvendatipolist',
                            read: 'T'
                        },
                        {
                            text: 'Controle Bancário',
                            module: 'relatoriosextrato',
                            read: 'T'
                        },
                        {
                            text: 'Posição Financeira Bancos',
                            module: 'relatoriosbancos',
                            read: 'T'
                        },
                        {
                            text: 'Romaneios',
                            module: 'relatoriosromaneios',
                            read: 'T'
                        },
                        {
                            text: 'Resultados Caixa',
                            module: 'relatoriosresultados',
                            read: 'T'
                        },
                        {
                            text: 'Demonstrativo Resultados',
                            module: 'relatoriosdemonstrativo',
                            read: 'T'
                        },
                        {
                            text: 'Inventário Produtos',
                            module: 'relatoriosinventario',
                            read: 'T'
                        },
                        {
                            text: 'Compras Produtos',
                            module: 'relatorioscompras',
                            read: 'T'
                        },
                        {
                            text: 'Lucratividade',
                            module: 'relatorioslucratividade',
                            read: 'T'
                        },
                        {
                            text: 'Livro Produto Controlado',
                            module: 'relatorioslivrocontrolado',
                            read: 'T'
                        },
                        {
                            text: 'Fluxo de Caixa Sintético',
                            module: 'relatorioscaixasintetico',
                            read: 'T'
                        },
                        {
                            text: 'Vendas por Vendedor Sintética',
                            module: 'relatoriosvendasvendedorsintetica',
                            isWindow: true,
                            read: 'T'
                        },
                        {
                            text: 'Vendas por Vendedor Analítica',
                            module: 'relatoriosvendasvendedoranalitica',
                            isWindow: true,
                            read: 'T'
                        },
                        {
                            text: 'Vendas por Pessoa Sintética',
                            module: 'relatoriosvendaspessoassintetica',
                            isWindow: true,
                            read: 'T'
                        },
                        {
                            text: 'Vendas por Pessoa Analítica',
                            module: 'relatoriosvendaspessoasanalitica',
                            isWindow: true,
                            read: 'T'
                        },
                        {
                            text: 'Relatório Bancos',
                            module: 'relatorioscontascorrentes',
                            isWindow: true,
                            read: 'T'
                        },
                        {
                            text: 'Controle de Vacinas',
                            module: 'relatorioscontrolevacinas',
                            isWindow: true,
                            read: 'T'
                        },
                        {
                            text: 'Ressarcimento ST',
                            module: 'relatoriosressarcimentost',
                            isWindow: true,
                            read: 'T'
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
                            read: 'T'
                        },
                        {
                            text: 'Etiquetas Pessoas',
                            module: 'emissaoetiquetaspessoas',
                            read: 'T'
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
                            read: 'T'
                        },
                        {
                            text: 'Sped Fiscal (Bloco K)',
                            module: 'spedblocok',
                            read: 'T'
                        },
                        {
                            text: 'CSV Preços',
                            module: 'csvprecos',
                            read: 'T'
                        },
                        {
                            text: 'Atualizar Preços',
                            module: 'processosprecos',
                            read: 'T'
                        },
                        {
                            text: 'Atualizar Estoque',
                            module: 'processosestoque',
                            read: 'T'
                        },
                        {
                            text: 'Ajustar Entradas',
                            module: 'processosentradas',
                            read: 'T'
                        },
                        {
                            text: 'XML Contabilidade',
                            module: 'xmlcontabilidade',
                            read: 'T'
                        },
                        {
                            text: 'CSV Contabilidade',
                            module: 'csvcontabilidade',
                            read: 'T'
                        },
                        {
                            text: 'CSV Inventário',
                            module: 'csvinventario',
                            read: 'T'
                        },
                        {
                            text: 'TXT Contabilidade',
                            module: 'txtcontabilidade',
                            read: 'T'
                        },
                        {
                            text: 'Gerar PDFs NF-e',
                            module: 'processosgerarpdfsnfe',
                            read: 'T'
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
