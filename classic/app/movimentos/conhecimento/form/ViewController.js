Ext.define('SamosAdmin.movimentos.conhecimento.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formconhecimento',

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getListView().title;
            await Conhecimento.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },

    onAlterarClick: function (btn, event) {
        const model = this.getRecord();

        if(!this.permiteAlteracao && 
           !configs.getMovimentos().desativaSenha &&  
           !configs.getUsuario().privilegiado){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteAlteracao = true;
                    model.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onAlterarClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else  {
            const id      = model.get('CONHECIMENTOS_ID');
            const numero  = model.get('CONHECIMENTOS_NUMERO');
            const serie   = model.get('CONHECIMENTOS_SERIE');
            const empresa = model.get('CONHECIMENTOS_ID_EMPRESAS');

            model.getProxy().setExtraParam('log', `PUT /conhecimento/${id} (${numero}|${serie}|${empresa})`);
            this.callParent(arguments);
            delete this.permiteAlteracao;
        }
    },

    onExcluirClick: async function (btn, event) {
        const view = this.getView();
        
        try {
            const model = this.getRecord();
    
            if(!configs.getUsuario().privilegiado &&
               !configs.getMovimentos().desativaSenha){
                const nivel = 1;
                await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel);
                model.getProxy().setExtraParam('senhaNivel', 'true');
            }
            
            const id      = model.get('CONHECIMENTOS_ID');
            const numero  = model.get('CONHECIMENTOS_NUMERO');
            const serie   = model.get('CONHECIMENTOS_SERIE');
            const empresa = model.get('CONHECIMENTOS_ID_EMPRESAS');

            if(await SamosUtils.Msg.confirm('Deseja realmente excluir?')){
                view.initGauge('Excluindo...');
                this.colocarFilhosNoModel(model);
    
                model.getProxy().setExtraParam('log', `DELETE /conhecimento/${id} (${numero}|${serie}|${empresa})`);
    
                await model.erase();

                if(this.getListView && this.getListView().down('grid')) {
                    this.getListView().down('grid').getStore().load();
                }

                Ext.Note('success', 'Registro excluído');

                await SamosUtils.Utils.sleep(500);

                this.onSairClick();

                if(this.getListView && this.getListView().down('grid')) {
                    this.getListView().down('toolbar').focus(true);
                }
            }

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao excluir');
        }
        
        view.stopGauge();
    },
    
    onSefazClick: function (btn, e) {
        Movimento.services.Sefaz.criarJanela('conhecimento', 'CONHECIMENTOS');
    },

    extrairCodigoBarras: function(txt, event){
        if(SamosUtils.Events.isEnter(event) || SamosUtils.Events.isTab(event)) {
            const gridNotas = this.lookup('notas');
            const selection = gridNotas.getSelection();
            const nota      = selection.getValues();
            const barras    = txt.getValue();
            const ano       = barras.substr(2, 2);
            const mes       = barras.substr(4, 2);
            const emissao   = momentTz(`20${ano}-${mes}-01`).hours(0).minutes(0).seconds(0);
            const numero    = parseInt(barras.substr(25, 9));
            const serie     = parseInt(barras.substr(22, 3));
            const numAtual  = nota['CONHECIMENTOSITENS_NUMERO'];
            const serAtual  = nota['CONHECIMENTOSITENS_SERIE'];

            if(
                !numAtual &&
                !serAtual &&
                emissao && 
                numero && 
                serie
            ){
                nota['CONHECIMENTOSITENS_NUMERO']  = numero;
                nota['CONHECIMENTOSITENS_SERIE']   = serie;
                nota['CONHECIMENTOSITENS_EMISSAO'] = momentTz(emissao).format('YYYY-MM-DD');
                
                selection.setValues(nota);
    
                setTimeout(() => {
                    gridNotas.publicarModel(txt, txt.up('form'));
                }, 200);
            }
        }
    },

    fazerSomas: function(txt) {
        this.iniciarEdicao();

        const notas = this.getViewModel().getStore('notas').data.items;

        const somaTotal = notas.reduce((total, nota) => {
            return total + cents(nota.get('CONHECIMENTOSITENS_TOTAL'));
        }, 0);

        this.getRecord().set({
            'CONHECIMENTOS_MERCADORIA': somaTotal/ 100
        });
    },

    publicarModel: function(txt, record) {
        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    onFecharClick: async function(btn, e) {  
        const view = this.getView();
        
        try {
            view.initGauge();

            await SamosUtils.Utils.sleep(100);
    
            view.query('datefield').forEach(datefield => {
                datefield.suspendEvents();
            });
    
            view.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

            await this.validarCabecalho();

            this.fazerSomas();
            this.lookup('observacoes').focus(true);
            this.finalizarEdicao();
            view.stopGauge(true);

            setTimeout(() => {
                view.query('datefield').forEach(datefield => {
                    datefield.resumeEvents();
                });
            }, 1000);
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao fechar');
        }
        
        view.stopGauge();
    },

    onDestinatarioChange: function(){
        const model = this.getRecord();

        const ufOrigem   = model.get('PESSOAS_UF');
        const ufDestino  = model.get('DESTINATARIO_UF')
        const idCfop     = model.get('CONHECIMENTOS_ID_OPERACOES');
        let cfopAjustado = idCfop;

        if(ufOrigem != '' && ufDestino != '') {
            if(idCfop.toString().slice(0, 1) == '5' && ufDestino != ufOrigem) {
                cfopAjustado = ('6' + idCfop.toString().slice(1, 6));
            } else {
                if(idCfop.toString().slice(0, 1) == '6' && ufDestino == ufOrigem) {
                    cfopAjustado = ('5' + idCfop.toString().slice(1, 6));
                }
            }
        }

        model.set('CONHECIMENTOS_ID_OPERACOES', cfopAjustado);
        this.lookup('operacao').setSearchedId(cfopAjustado);

    }

});
