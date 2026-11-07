Ext.define('SamosAdmin.movimentos.manifestos.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formmanifestos',

    initViewModel: function(vm){
        setTimeout(() => {
            const estados = vm.get('model.MANIFESTOS_ESTADOS');
            const arrayEstados = estados ? estados.split('|') : [];
            this.lookup('apercorrer').setValue(arrayEstados);
        }, 1000);
    },

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getListView().title;
            await Manifesto.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },

    onAlterarClick: function (btn, event) {
        const model = this.getRecord();

        if(!this.permiteAlteracao && 
           !configs.getUsuario().privilegiado &&
           !configs.getMovimentos().desativaSenha){
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
            const id      = model.get('MANIFESTOS_ID');
            const numero  = model.get('MANIFESTOS_NUMERO');
            const serie   = model.get('MANIFESTOS_SERIE');
            const empresa = model.get('MANIFESTOS_ID_EMPRESAS');

            model.getProxy().setExtraParam('log', `PUT /manifestos/${id} (${numero}|${serie}|${empresa})`);
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
            
            const id      = model.get('MANIFESTOS_ID');
            const numero  = model.get('MANIFESTOS_NUMERO');
            const serie   = model.get('MANIFESTOS_SERIE');
            const empresa = model.get('MANIFESTOS_ID_EMPRESAS');

            if(await SamosUtils.Msg.confirm('Deseja realmente excluir?')){
                view.initGauge('Excluindo...');
                this.colocarFilhosNoModel(model);
    
                model.getProxy().setExtraParam('log', `DELETE /manifestos/${id} (${numero}|${serie}|${empresa})`);
    
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
        
        try { view.stopGauge(); } catch(e) {}
    },

    onFecharClick: async function(btn, e) {  
        const view = this.getView();
        const vm = this.getViewModel();
        const idCarregamento = vm.get('model.MANIFESTOS_ID_CARREGAMENTO');

        this.lookup('placabusca').setValue(''); 
        this.lookup('placabusca').setSearchedId('');
        
        this.lookup('pessoabusca').setValue('');
        this.lookup('pessoabusca').setSearchedId('');
        
        const valueTransporte = this.lookup('transporte').getValue() || '';        

        this.lookup('transporte').setValue(valueTransporte);        
        this.lookup('transporte').setSearchedId(valueTransporte);

        const valueCarregamento = this.lookup('carregamento').getValue() || '';        

        this.lookup('carregamento').setValue(valueCarregamento);        
        this.lookup('carregamento').setSearchedId(valueCarregamento);

        const valueCepCarga = this.lookup('cepcarga').getValue() || '';        

        this.lookup('cepcarga').setValue(valueCepCarga);        
        this.lookup('cepcarga').setSearchedId(valueCepCarga);

        const valueCepDescarga = this.lookup('cepdescarga').getValue() || '';        

        this.lookup('cepdescarga').setValue(valueCepDescarga);        
        this.lookup('cepdescarga').setSearchedId(valueCepDescarga);

        try {

            if(parseInt(idCarregamento).toString() == 'NaN'){
                throw 'Informe o município de carregamento';                                
            }
    
            view.initGauge();
            await SamosUtils.Utils.sleep(100);
            view.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

            await this.validarCabecalho();

            this.fazerSomas()
            this.lookup('observacoes').focus(true);
            this.finalizarEdicao();
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao fechar');
        }
        
        view.stopGauge();
    },
    
    onSefazClick: function (btn, e) {
        Movimento.services.Sefaz.criarJanela('manifestos', 'MANIFESTOS');
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
            const numAtual  = nota['MANIFESTOSITENS_NUMERO'];
            const serAtual  = nota['MANIFESTOSITENS_SERIE'];

            if(
                !numAtual &&
                !serAtual &&
                emissao && 
                numero && 
                serie
            ){
                nota['MANIFESTOSITENS_NUMERO']  = numero;
                nota['MANIFESTOSITENS_SERIE']   = serie;
                nota['MANIFESTOSITENS_EMISSAO'] = momentTz(emissao).format('YYYY-MM-DD');

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
        let qtdNfe = 0;
        let qtdCte = 0;

        const somaProdutos = notas.reduce((total, nota) => {
            if(nota.get('MANIFESTOSITENS_SERIE') == 'NE') {
                qtdNfe++;
            } else {
                qtdCte++;
            }
            return total + cents(nota.get('MANIFESTOSITENS_PRODUTOS'));
        }, 0);

        const somaTotal = notas.reduce((total, nota) => {
            return total + cents(nota.get('MANIFESTOSITENS_TOTAL'));
        }, 0);

        this.getRecord().set({
            'MANIFESTOS_QUANTIDADENFE': qtdNfe,
            'MANIFESTOS_QUANTIDADECFE': qtdCte,
            'MANIFESTOS_PRODUTOS': somaProdutos / 100,
            'MANIFESTOS_TOTAL':    somaTotal    / 100
        });
    },

    publicarModel: function(txt, record) {
        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    changeCpfCnpj: function(txt) {
        var vm = this.getViewModel(),
            cpfCnpj = SamosUtils.String.onlyNumbers(txt.getValue());

        if(vm.get('readOnly') || txt.readOnly) { 
            if(cpfCnpj.length == 11) {
                txt.setTextMask('___.___.___-__', cpfCnpj);
                txt.setFieldLabel('CPF');
            } else {
                txt.setTextMask('__.___.___/____-__', cpfCnpj);            
                txt.setFieldLabel('CNPJ');
            }
        } else {
            txt.setTextMask('___.___.___-__', cpfCnpj);
            txt.setFieldLabel('CPF');
        }
    },

    filtrarEstadosAPercorrer: function(txt){
        setTimeout(() => {
            const ufinicial = this.getViewModel().get('model.MANIFESTOS_PERCURSOINICIAL');
            const uffinal   = this.getViewModel().get('model.MANIFESTOS_PERCURSOFINAL');
     
            const novaStore = Object.keys(SamosUtils.Info.getEstados()).filter(uf => (uf != ufinicial) && (uf != uffinal));
            
            this.lookup('apercorrer').setStore(novaStore);
        }, 300);
    },
    
    onGravarClick: async function() {
        const estados = this.lookup('apercorrer').getValue();
        const model = this.getRecord();

        model.set('MANIFESTOS_ESTADOS', estados.join('|'));
        
        await this.validarCabecalho();

        if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
            this.getView().initGauge('Gravando...');
            this.colocarFilhosNoModel(model);

            model.data['MANIFESTOS_ITENS'] = model.data['MANIFESTOS_ITENS'].map(item => {
                item['MANIFESTOSITENS_NUMERO']     = item['MANIFESTOSITENS_NUMERO']     || 0;
                item['MANIFESTOSITENS_SERIE']      = item['MANIFESTOSITENS_SERIE']      || 'NE';
                return item;
            })

            try {
                const record = await model.save();
                this.onGravacaoSucesso(record)
                
            } catch (error) {
                this.onGravacaoFalha(error);
            }
            
            this.aposGravar();
        }
    },

    aposGravar: function() {
        const estados = this.getViewModel().get('model.MANIFESTOS_ESTADOS');
        const arrayEstados = estados.split('|');
        arrayEstados.sort();
        this.lookup('apercorrer').setValue(arrayEstados);
        
        this.callParent(arguments);
    },  
    
    onAposSelecionarNota: async function(field, selectEvent){
        const inputValue = Number(field.getValue()),
              formGrid = field.up(),
              gridRef = formGrid.up(),
              storeRef = gridRef.getStore(),
              recordsStore = storeRef.data.items,
              controllerContext = this;

        const blurFn = async function(fieldRef, blurEvent){
            //Ignora o evento de Control e outras teclas que não sejam numéricas
            if(this.selectEvent.key == 'Control') {
                return;
            }
            //Ignora letras, porém permite o v pois é o CTRL + V
            if( !SamosUtils.String.isNumber( this.selectEvent.key ) && this.selectEvent.key != 'v' ) {
                return;
            }

            //Verifica se a nota ja existe em outro manifesto
            const notaJaExiste = await controllerContext.checarExisteNotaEmAlgumManifesto( fieldRef.getValue() );

            //Verifica tambem se a nota ja existe dentro da propia grid
            //const notaJaEstaNaGrid = recordsStore.some( function(model){ return model.get('MANIFESTOSITENS_NUMERO') == String(inputValue) } );

            let notaJaEstaNaGrid = false;

            const camposGrid = Ext.$('formmanifestos')[0]
                                 .down('samoswidgets-griditems')
                                 .query('samoswidgets-textsearch');

            //Procura se a nota ja esta na grid
            for( let i = 0 ; i < camposGrid.length ; i++ )
            {
                const campoAtual = camposGrid[i],
                      valorCampo = campoAtual.getValue();

                //Se a nota foi encontrada no campo atual e se o campo atual for diferente do propio campo que o usuario esta digitando
                if( valorCampo == fieldRef.getValue() && valorCampo != '' && campoAtual.id != fieldRef.id )
                {
                    notaJaEstaNaGrid = true;
                    break;
                }   
            }

            if(notaJaExiste != false)
            {
                Ext.Note('warning', `NF-E '${ notaJaExiste['MANIFESTOSITENS_NUMERO'] }', já está no manifesto '${notaJaExiste['MANIFESTOS_NUMERO']}'. Não é possivel duplicidade.`, 2000);
                field.setValue('');
            }

            if( notaJaExiste == false && notaJaEstaNaGrid != false )
            {
                Ext.Note('warning', `NF-E '${ fieldRef.getValue() }', já está no manifesto atual. Não é possivel duplicidade.`, 2000);
                field.setValue('');
            }

            //Checa outras coisas
            const dadosNfe = await controllerContext.obterNotaPeloNumero( fieldRef.getValue() );

            if(dadosNfe['MOVIMENTOS_PROTOCOLO'] == ''){
                Ext.Note('warning', `NF-E '${ fieldRef.getValue() }' sem protocolo. Não é possivel adicionar ao manifesto.`, 2100);
                field.setValue('');
            }

            if(dadosNfe['MOVIMENTOS_STATUS'] == 'C' || dadosNfe['MOVIMENTOS_STATUS'] == 'D'){
                Ext.Note('warning', `NF-E '${ fieldRef.getValue() }' cancelada ou denegada. Não é possivel adicionar ao manifesto.`, 2100);
                field.setValue('');
            }

        }.bind({selectEvent});

        if(!field.jaDeuBlur)
        {
            field.on('blur', blurFn);
            field.jaDeuBlur = true;
        }

        //Ao dar CTRL + V ele vai pegar
        if( selectEvent.key == 'v' ){
            blurFn(field, null);
        }

    },

    //Outras funções
    checarExisteNotaEmAlgumManifesto: function(nfe){
        return new Promise(async function(resolve){
            //Obter todos os manifestos
            const consultaManifestos = await SamosUtils.Request.nodeApi({
                url: `/processos/executasql`,
                method: 'GET',
                query: {
                    nomeSql: 'pesquisar_NFE_dentro_algum_manifesto',
                    parametroSql: JSON.stringify({
                        NFE: nfe,
                        EMPRESA: configs.getEmpresa().id
                    })
                }
            }); 

            const manifestosConsultados = consultaManifestos.results;

            if(manifestosConsultados.length > 0) {
                resolve(manifestosConsultados[0]);
            } else {
                resolve(false);
            }
        });
    },

    obterNotaPeloNumero: function(nfe){
        return new Promise(async function(resolve){
            //Obter a nota
            const consultaNota = await SamosUtils.Request.nodeApi({
                url: `/processos/executasql`,
                method: 'GET',
                query: {
                    nomeSql: 'ler_protocolo_NFE_porNumero',
                    parametroSql: JSON.stringify({
                        NFE: nfe,
                        EMPRESA: configs.getEmpresa().id
                    })
                }
            }); 

            const queryNota = consultaNota.results;

            if(queryNota.length > 0) {
                resolve(queryNota[0]);
            } else {
                resolve(false);
            }
        });
    }
    
});