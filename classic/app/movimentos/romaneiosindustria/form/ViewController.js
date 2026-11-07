Ext.define('SamosAdmin.movimentos.romaneiosindustria.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formromaneiosindustria', 

    onNovoClick: async function () {

        const view = this.getView();        

        try {
            this.gravado = false;        
            const nomeDocumento = this.getListView().title;
            const form = await this.callParent(arguments);            
            await RomaneioIndustria.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },

    onPedidosClick: function(btn, e) {
        const isEntrega = this.getView().listName.match(/Entrega/);
        
        btn.up('samoswidgets-dinamicbutton').openSearch({
            title: 'Pedidos',
            tabela: 'movimentos',
            proximoFoco: 'pessoa',
            multi: true,
            valueStatus: isEntrega ? 11 : 12,
            situacao: null,
            multiEmpresa: isEntrega ? true : false,
            permitirApenasDeUmaPessoa: false,
            permitirApenasDeUmaEmpresa: false
        })
        .then(Movimento.services.ImportacaoExportacao.obterMovimentosCompletos)
        .then(records => {
            this.lookup('pedidos').removeAllItems();

            const movimentos = records.map((movimento, index) => {
                return Ext.create('SamosAdmin.movimentos.romaneiosindustria.ModelItens', {
                    'ROMANEIOSITENS_ID':            (index + 1) * - 1,
                    'ROMANEIOSITENS_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'),
                    'ROMANEIOSITENS_ID_ITEM':       1,
                    'ROMANEIOSITENS_QUANTIDADE':    1,
                    'ROMANEIOSITENS_TOTAL':         movimento.get('MONTAGENS_VALOR'),
                    'MOVIMENTOS_NUMERO':            movimento.get('MOVIMENTOS_NUMERO'),
                    'MOVIMENTOS_SERIE':             movimento.get('MOVIMENTOS_SERIE'),
                    'MOVIMENTOS_ID_EMPRESAS':       movimento.get('MOVIMENTOS_ID_EMPRESAS'),
                    'MOVIMENTOS_ID_PESSOAS':        movimento.get('MOVIMENTOS_ID_PESSOAS'),
                    'MOVIMENTOS_NOME':              movimento.get('MOVIMENTOS_NOME'),
                    'MOVIMENTOS_ENTRADASAIDA':      movimento.get('MOVIMENTOS_ENTRADASAIDA'),
                    'CIDADES_NOME':                 movimento.get('CIDADES_NOME'),
                    'CIDADES_ESTADO':               movimento.get('CIDADES_ESTADO'),
                    'MOVIMENTOS_IMPOSTO':           movimento.get('MOVIMENTOS_IMPOSTO'),
                    'MONTAGENS_VALOR':              movimento.get('MONTAGENS_VALOR')
                });
            });

            const total = records.reduce((total, record) => {
                return total + cents(record.get('MOVIMENTOS_IMPOSTO'));
            }, 0) / 100;

            this.getViewModel().get('model').set({
                'ROMANEIOS_ITENS': movimentos,
                'ROMANEIOS_TOTAL': total,
                'CONTAGEM_ITENS' : movimentos.length
            });

            if(movimentos.length == 1 && records[0]) {  // Se apenas 1 pedido
                this.getViewModel().get('model').set({
                    'ROMANEIOS_OBSERVACOES': records[0].data['MOVIMENTOS_OBSERVACOES']
                });    
            }

            this.calcularValorServico();
        });
    },

    onAlterarClick: function() {
        this.gravado = false;
        this.callParent(arguments);
    },

    onExecutarClick: function (btn, event) {
        const romaneio = this.getRecord();
        const id = romaneio.get('ROMANEIOS_ID');
        const valorServico = cents(romaneio.get('ROMANEIOS_FRETE'));
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente executar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Executando...');
                
                setTimeout(() => {
                    if(valorServico == 0){ 
                        romaneio.set({
                            'ROMANEIOS_SAIDA' : momentServer().format('YYYY-MM-DD'),
                            'ROMANEIOS_STATUS': 'F'
                        });
                    } else {
                        romaneio.set('ROMANEIOS_STATUS', 'E');
                    }

                    romaneio.save()
                        .then(romaneio => {
                            SamosUtils.Request.nodeApi({
                                url: `/relatorios/${configs.getClientName()}/comprovanteromaneioindustriaexecutado`,
                                method: 'GET',
                                query: {
                                    id: id,
                                    nomedocumento: romaneio.get('DOCUMENTOS_NOME')
                                }
                            })
                            .done(res => {
                                setTimeout(() => {
                                    SamosUtils.Pdf.exibir({
                                        local: 'window',
                                        caminho: res.results[0]['name'], 
                                        serverType: 'nodejs'
                                    });
                                    setTimeout(() => {
                                        Ext.Note('success', 'Romaneio executado com sucesso');
                                    }, 100);
                                }, 300);
                            })
                            .fail(err => {
                                Ext.Note('error', 'Erro no servidor');
                                console.error(err);
                            })
                        })
                        .catch(this.onGravacaoFalha.bind(this))
                        .finally(this.aposGravar.bind(this));
                }, 200);
            }
        });
    },

    onReativarClick: function (btn, event) {
        const romaneio = this.getRecord();
        const id = romaneio.get('ROMANEIOS_ID');
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente reativar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Reativando...');
                
                setTimeout(() => {
                    romaneio.set('ROMANEIOS_STATUS', 'N');
                    romaneio.save()
                    .then(res => {Ext.Note('success', 'Romaneio reativado com sucesso!');})
                    .catch(this.onGravacaoFalha.bind(this))
                    .finally(this.aposGravar.bind(this));
                }, 200);
            }
        });
    },

    onGravarClick: function (btn, event) {
        const model = this.getRecord();
    
        this.validarCabecalho()
        .then(() => {
            setTimeout(() => {
                Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                    if (btn == 'yes') {
                        this.getView().initGauge('Gravando...');
                        
                        setTimeout(() => {
                            this.colocarFilhosNoModel(model);
                            this.gravado = true;
                            model.save()
                                .then(this.onGravacaoSucesso.bind(this))
                                .catch(this.onGravacaoFalha.bind(this))
                                .finally(this.aposGravar.bind(this));
                        }, 200);

                    }
                });
            }, 200);
        });        
    },

    onGravacaoSucesso: function (record) {
        this.callParent(arguments);
        this.getView().query('samoswidgets-griditems').forEach(grid => grid.carregarDoModel());
    },

    onGravacaoFalha: function (error) {
        console.error(error);  
        SamosUtils.Msg.error(error, 'Não foi possível Gravar Romaneio');
        this.callParent(arguments);
    },


    onExcluirClick: function (btn, event) {
        const model = this.getRecord();

        if(!this.permiteExclusao && !configs.getUsuario().privilegiado){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteExclusao = true;
                    model.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onExcluirClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else {
            delete this.permiteExclusao;

            const id      = model.get('MOVIMENTOS_ID');
            const numero  = model.get('MOVIMENTOS_NUMERO');
            const serie   = model.get('MOVIMENTOS_SERIE');
            const empresa = model.get('MOVIMENTOS_ID_EMPRESAS');

            Ext.Msg.confirmDelete(btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Excluindo...');
                    this.colocarFilhosNoModel(model);
                    
                    model.getProxy().setExtraParam('log', `DELETE /romaneiosindustria/${id} (${numero}|${serie}|${empresa})`);
                    
                    model.erase()
                        .then(() => {
                            this.getView().stopGauge();
                            this.getListView().down('grid').getStore().load();
                            Ext.Note('success', 'Registro excluído');
                            setTimeout(() => {
                                this.onSairClick();
                                this.getListView().down('toolbar').focus(true);
                            }, 500);
                        })
                        .catch(() => Ext.Note('error', 'Erro no servidor'))
                        .finally(() => this.getView().stopGauge())
                }
            });
        }
    },

    setarUrbanoOuSuburbano: function(txt, nv, valorAnterior) {
        if(this.getViewModel().get('updating') && !this.gravado) {
            const tipoAnterior = valorAnterior == 'U' ? 'urbanos'    : 
                                 valorAnterior == 'S' ? 'suburbanos' :
                                                         undefined;
            
            if(tipoAnterior){
                const storePedidos = this.lookup('pedidos').getStore();
                const pedidos = storePedidos.data.items;

                if(pedidos.length > 0) {
                    Ext.Msg.confirm('Confirmação', `Os pedidos ${tipoAnterior} serão removidos.<br><span style="color:red;font-weight:bold;">Continuar?</span> `, btn => {
                        if (btn == 'yes') {
                            storePedidos.removeAll();
                            this.getRecord()['ROMANEIOS_ITENS'] = [];
                        } else {
                            txt.suspendEvents();
                            txt.setValue(valorAnterior);
                            Ext.defer(txt.resumeEvents, 200, txt);
                        }
                    });
                }
            }
        }

        this.calcularValorServico();
    },

    validarPessoaRomaneio: function() {
        const romaneio = this.getRecord();
        const isEntrega = this.getView().listName.match(/Entrega/);

        if(isEntrega) {  // N/O/R
            if(romaneio.get('PESSOAS_TIPO') == 'N' || romaneio.get('PESSOAS_TIPO') == 'O' || romaneio.get('ROMANEIOS_STATUS') == 'R')  {
                return true;
            }
        } else { // M/F
            if(romaneio.get('PESSOAS_TIPO') == 'M' || romaneio.get('PESSOAS_TIPO') == 'F') {
                return true;
            }
        }

        return false;

    },

    calcularValorServico: function(pessoa) {
        if(this.getViewModel().get('updating') && !this.gravado) {
            setTimeout(() => {
                const totalRomaneio = this.lookup('pedidos').getStore().data.items.reduce((total, record) => {
                    return total + cents(record.get('MOVIMENTOS_IMPOSTO'));
                }, 0);
                
                const romaneio = this.getRecord();
                const isEntrega = this.getView().listName.match(/Entrega/);
                const isRetirado = romaneio.get('ROMANEIOS_STATUS') == 'R';
                let valorServico = 0;
                let unitarioServico = 0;

                if(isEntrega){
                    if(!isRetirado) {
                        const urbano = romaneio.get('ROMANEIOS_LOCAL') == 'U';
                        const formula = SamosUtils.Json.parseJSON(romaneio.get('PESSOAS_FORMULA'));
        
                        if(formula) {
                            const percentual = formula['tipo'] == 'percentual';                
                            if (percentual) {
// Calculando e setando o valor do frete unitário do romaneio.
                                const percentualItens = this.lookup('pedidos').getStore().data.items.reduce((total, record) => {
                                    if (totalRomaneio / 100 <= 500) {
                                        if (urbano){
                                            unitarioServico = parseInt((cents(record.get('MOVIMENTOS_IMPOSTO')) / 100) * formula['urbA']);
                                            record.set('ROMANEIOSITENS_TOTAL', (unitarioServico / 100));
                                        } else {
                                            unitarioServico = parseInt((cents(record.get('MOVIMENTOS_IMPOSTO')) / 100) * formula['subA']);
                                            record.set('ROMANEIOSITENS_TOTAL', (unitarioServico / 100));
                                        }
                                    } else {
                                        if (urbano) {
                                            unitarioServico = parseInt((cents(record.get('MOVIMENTOS_IMPOSTO')) / 100) * formula['urbB']);
                                            record.set('ROMANEIOSITENS_TOTAL', (unitarioServico / 100));                                            
                                        } else {
                                            unitarioServico = parseInt((cents(record.get('MOVIMENTOS_IMPOSTO')) / 100) * formula['subB']);
                                            record.set('ROMANEIOSITENS_TOTAL', (unitarioServico / 100));
                                        }
                                    }    
                                    return total + cents(record.get('MOVIMENTOS_IMPOSTO'));
                                }, 0);
// fim do cálculo
                                if (totalRomaneio / 100 <= 500) {
                                    if (urbano){
                                        valorServico = parseInt((totalRomaneio / 100) * formula['urbA']);
                                    } else {
                                        valorServico = parseInt((totalRomaneio / 100) * formula['subA']);    
                                    }
                                } else {
                                    if (urbano) {
                                        valorServico = parseInt((totalRomaneio / 100) * formula['urbB']);
                                    } else {
                                        valorServico = parseInt((totalRomaneio / 100) * formula['subB']);
                                    }
                                }
                            } else {
                                valorServico = this.lookup('pedidos').getStore().data.items.reduce((total, record) => {

                                    let valorFretePedido = 0;
                                    if (record.get('MOVIMENTOS_IMPOSTO') <= 500) {
                                        if (urbano) {
                                            valorFretePedido = cents(formula['urbA']);
                                        } else {
                                            valorFretePedido = cents(formula['subA']);
                                        }
                                    } else {
                                        if (urbano) {
                                            valorFretePedido = cents(formula['urbB']);
                                        } else {
                                            valorFretePedido = cents(formula['subB']);
                                        }
                                    }
                                   record.set('ROMANEIOSITENS_TOTAL', (valorFretePedido / 100));  // Setando o itens
                                   return total + valorFretePedido;
                                }, 0);           
                            }
                        }    
                    }
                } else {
                    valorServico = this.lookup('pedidos').getStore().data.items.reduce((total, record) => {
                        return total + cents(record.get('MONTAGENS_VALOR'));
                    }, 0);
                }

                romaneio.set({
                    'ROMANEIOS_FRETE': valorServico  / 100,
                    'ROMANEIOS_TOTAL': totalRomaneio / 100,
                    'CONTAGEM_ITENS' : this.lookup('pedidos').getStore().data.items.length
                });
            }, 500);
        }
    },

    onBaixarClick: function(btn, e) {
        const view = Ext.create({ 
            xtype: 'formromaneiosindustriabaixar'
        });

        view.romaneio = this.getRecord()

        this.getView().add(view);
    },

    onImprimirClick: async function(btn, e) {
        if(btn.menu) { return; }

        this.onRomaneioClick();
    },

    onRomaneioClick: async function() {
        const view = this.getView();
        const model = this.getRecord();
        
        if(
            configs.getMovimentos().senhaImpressao && 
            !configs.getUsuario().privilegiado &&                     
            parseInt(model.get('ROMANEIOS_CONTADOR')) >  0
        ) {
            const nivel = 3;
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
        }
        
        try {
            if(!model.get('DOCUMENTOS_LAYOUT')) {
                throw 'Informe o layout de impressão em Documentos > Layout';
            }
    
            delete this.permiteImpressao;

            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/romaneioindustria${model.get('DOCUMENTOS_LAYOUT')}`,
                method: 'GET',
                query: {
                    id: model.get('ROMANEIOS_ID'),
                    nomedocumento: model.get('DOCUMENTOS_NOME')
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

            if(configs.getMovimentos().senhaImpressao){
                const contaImpressao = parseInt(model.get('ROMANEIOS_CONTADOR'));
                model.set({ 'ROMANEIOS_CONTADOR': (contaImpressao + 1) });
                await model.save();
                Ext.Note('success', 'Log de impressão salvo com sucesso!');
            }                                    
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },    

    onComprovanteClick: async function(btn, e) {
        const view = this.getView();
        const model = this.getRecord();

        try {
            if(!model.get('DOCUMENTOS_LAYOUT')) {
                throw 'Informe o layout de impressão em Documentos > Layout';
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');
    
                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/comprovante${model.get('DOCUMENTOS_LAYOUT')}`,
                    method: 'GET',
                    query: {
                        id: model.get('ROMANEIOS_ID')
                    }
                });
    
                await SamosUtils.Utils.sleep(500);
    
                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });

                const countImpressao = parseInt(model.get('ROMANEIOS_CONTADOR') || 0);
                
                model.set({
                    'ROMANEIOS_IMPRESSAO': SamosUtils.Info.getLog(),
                    'ROMANEIOS_CONTADOR': countImpressao + 1
                });

                await model.save();
                
                Ext.Note('success', 'Log de impressão salvo com sucesso!');
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }
    
        view.stopGauge();
    },

    changeCpfCnpj: function(txt) {
        const cpfCnpj = SamosUtils.String.onlyNumbers(txt.getValue());

        if(cpfCnpj.length == 11) {
            txt.setTextMask('___.___.___-__', cpfCnpj);
            txt.setFieldLabel('CPF');
        } else {
            txt.setTextMask('__.___.___/____-__', cpfCnpj);            
            txt.setFieldLabel('CNPJ');
        }
    },

    focarAposPesquisa: function(txt, record) {
        const isEntrega = this.getView().listName.match(/Entrega/);

        if(isEntrega){
            this.lookup('local').focus(true);
        } else {
            this.lookup('numero0').focus(true);
        }
        
        this.calcularValorServico();
    }
});
