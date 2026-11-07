Ext.define('SamosAdmin.atualizacao.pessoas.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formpessoas',
    
    //Usado na hospitalar
    verificarDocumentosVencidos: async function(){
        const view = this.getView();
        const vm = view.getViewModel();
        const model = this.getRecord();
        const documentosVencidos = await SamosUtils.ConsultasGenerica.getDocumentosVencidos( model.get('PESSOAS_ID') );

        if( documentosVencidos.total > 0 ){
            Ext.Note('warning', `AVISO: Pessoa com ${documentosVencidos.total} documentos vencidos! verifique os documentos.`)
            return true;
        }else{
            return false;
        }
    },

    //Callback personalizado
    onAposCriarForm: async function(selfForm, isNovoModel){
        //Se for hospitalar
        if( configs.getClientName() == 'hospitalar' ){
            Ext.defer( async ()=>{
                //Exibe um aviso se a pessoa tiver documentos vencidos
                if( !isNovoModel ){ 
                    this.verificarDocumentosVencidos();
                }

            }, 250, this );
        }
    },

    //se apagar o CEP, sao sair do campo, ele limpar os dados do endereço automaticamente
    onSairCampoCep: function(campo, evento){
        const vm = this.getViewModel(),
              model = vm.get('model'),
              cepBuscando = campo.getRawValue().replace(/\D/ig, '');

        if( !vm.get('readOnly') && cepBuscando == '' ){
            //Limpa os campos pra evitar confusao
            model.set({
                'PESSOAS_ID_CIDADES' : '',
                'CIDADES_NOME'        : '',
                'CIDADES_ESTADO'      : '',
                'CIDADES_IBGE'        : '',
                'PESSOAS_ENDERECO'   : '',
                'PESSOAS_BAIRRO'     : ''
            });
        }
    },

    onSairCampoCepCobranca: function(campo, evento){
        const vm = this.getViewModel(),
              model = vm.get('model'),
              cepBuscando = campo.getRawValue().replace(/\D/ig, '');

        if( !vm.get('readOnly') && cepBuscando == '' ){
            //Limpa os campos pra evitar confusao
            model.set({
                'PESSOAS_ID_CIDADESCOBRANCA'  : '',
                'CIDADES_NOMECOBRANCA'        : '',
                'CIDADES_ESTADOCOBRANCA'      : '',
                'CIDADES_IBGECOBRANCA'        : '',
                'PESSOAS_ENDERECOCOBRANCA'    : '',
                'PESSOAS_BAIRROCOBRANCA'      : ''
            });
        }
    },

    onMudarTipoPessoa: async function(field, newValue, oldValue){
        const view = this.getView(),
              vm   = this.getViewModel(),
              isSupervisor = vm.get('isSupervisor'),
              model = this.getRecord();

        if(configs.getPessoas().senhaMudarTipo) {
            if(vm.get('ultimoTipoCliente') != newValue && !isSupervisor){
                const nivel = 1;
                Ext.Note('warning', 'Digite a senha');

                const pSenha = await( 
                    new Promise( (resolve, reject) => {
                        Ext.create({ 
                            xtype: 'samoswidgets-senhanivel',
                            //Cada vez que recusar a senha
                            onSenhaInvalida: function(viewRef, senhaDigitada){
                                
                            },

                            //Quando o usuario clicar em cancelar
                            onCancelarSenha: function(viewRef, senhaDigitada){
                                Ext.defer( ()=>{
                                    field.setValue( vm.get('tipoOriginalCliente') );
                                }, 10);
                            }
                        })
                            .iniciar(nivel)
                            .then(() => {
                                /*acao ao permitir*/
                                resolve(true);
                            })
                            .catch(() => {
                                resolve(false);          
                            });
                    } ) 
                );

                //Se a senha esta errada
                if(!pSenha){
                    Ext.defer( ()=>{
                        field.setValue( vm.get('tipoOriginalCliente') );
                        Ext.Note('warning', 'Operação não permitida.');
                    }, 10 );
                    return;
                    
                }else{
                    //Se passar, atualiza o valor original
                    vm.set('ultimoTipoCliente', newValue );
                    vm.set('tipoOriginalCliente', newValue );
                }
            }
        }

        if(configs.getClientName() == 'stilomoveis') {
            let nomePessoa = model.get('PESSOAS_NOME');
            if(newValue == 'N') { // Clientes loja
                if(nomePessoa.trim().slice(-1) != '*') {
                    model.set('PESSOAS_NOME', nomePessoa.trim() + '*');
                }
            } else {
                if(nomePessoa.trim().slice(-1) == '*') {
                    model.set('PESSOAS_NOME',  nomePessoa.trim().slice(0, -1));
                }
            }
        }
    },

    onAfterConstructor: async function(view){
        const vm    = this.getViewModel(),
              model = view.model;
        
        if(model)
        {
            vm.set('ultimoTipoCliente', model.get('PESSOAS_TIPO') );
            vm.set('tipoOriginalCliente', model.get('PESSOAS_TIPO') );
        }
    },
    
    onGravarClick: async function () {
        const view = this.getView(),
              model = this.getRecord();

        const cpfCnpj        = model.get('PESSOAS_CPFCNPJ'),
              campoInscricao = model.get('PESSOAS_INSCRICAO'),
              campoCategoria = view.lookupReference('categoria').getValue();

        if(model.get('PESSOAS_TELEFONE') == '' && model.get('PESSOAS_CELULAR') == '') {
            model.set('PESSOAS_TELEFONE', '99999999999');
        }

        if(model.get('PESSOAS_TELEFONECOBRANCA') == '' && model.get('PESSOAS_CELULARCOBRANCA') == '') {
            model.set('PESSOAS_TELEFONECOBRANCA', '99999999999');
        }

        if(model.get('PESSOAS_EMAIL') == '') {
            model.set('PESSOAS_EMAIL', 'email@provedor.com');
        }

        if( cpfCnpj.length == 11 && campoCategoria == '1' && campoInscricao.length > 0) {
            Ext.Note('warning', 'Pessoa Física não contribuinte - Inscrição estadual deve ficar em branco');
            return
        }

        if(configs.getClientName() == 'stilomoveis') {
            if(model.get('PESSOAS_TIPO') == 'N') { // Clientes loja
                if(model.get('PESSOAS_NOME').trim().slice(-1) != '*') {
                    Ext.Note('warning', 'Cliente Loja - Marcação * obrigatória');
                    return
                }
            }    
        }
        
        await this.validarCabecalho();

        if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')){
            try {
                this.getView().initGauge('Gravando...');
                this.colocarFilhosNoModel(model);
                const modelSalvo = await model.save();
                this.onGravacaoSucesso(modelSalvo);
            } catch (error) {
                this.onGravacaoFalha(error);
            }
            this.aposGravar();

            if(this.getView().resolve) {
                this.getView().resolve(model, this.getView())
            }
        }
    },

    onCreditoClick: function (btn, e) {
        Movimento.services.Caixa.criarJanelaReceber();
    },

    onIncluirPedidoClick: async function (btn, e) {

        await this.onSairClick();
        await Ext.$('pessoas')[0].getController().onSairClick();
        const tabpanel   = Ext.$('samosviewport')[0].down('tabpanel');
        let listPedidos;  
        const permissoes = Permissao.services.Model.get({
            groupName: 'Movimentos',
            moduleName: 'Pedidos'
        });

        const create  = permissoes.create;
        const update  = permissoes.update;
        const destroy = permissoes.destroy;

        listPedidos = tabpanel.add({
            xtype: 'movimentos',
            title: 'Pedidos',
            permissoes: {
                lockNovo:    create  === false || create  === 'F',
                lockAlterar: update  === false || update  === 'F',
                lockExcluir: destroy === false || destroy === 'F'
            }
        });

        tabpanel.setActiveTab(listPedidos);
        await Ext.$('movimentos')[0].getViewModel().set('pessoaOrigem', this.getRecord());
        await Ext.$('movimentos')[0].getController().onNovoClick();                

    },

    onIncluirOrcamentoClick: async function (btn, e) {

        await this.onSairClick();
        await Ext.$('pessoas')[0].getController().onSairClick();
        const tabpanel   = Ext.$('samosviewport')[0].down('tabpanel');
        let listOrcamentos;  
        const permissoes = Permissao.services.Model.get({
            groupName: 'Movimentos',
            moduleName: 'Orçamentos'
        });

        const create  = permissoes.create;
        const update  = permissoes.update;
        const destroy = permissoes.destroy;

        listOrcamentos = tabpanel.add({
            xtype: 'movimentos',
            title: 'Orçamentos',
            permissoes: {
                lockNovo:    create  === false || create  === 'F',
                lockAlterar: update  === false || update  === 'F',
                lockExcluir: destroy === false || destroy === 'F'
            }
        });

        tabpanel.setActiveTab(listOrcamentos);
        await Ext.$('movimentos')[0].getViewModel().set('pessoaOrigem', this.getRecord());
        await Ext.$('movimentos')[0].getController().onNovoClick();

    },
    
    onParametrosTransporteClick: function (btn, e) {
        const view = Ext.create({
            xtype: 'formpessoasformulatransporte',
            permissoes: this.getView().getPermissoes()
        });

        view.getViewModel().set({
            pessoa: this.getRecord(),
            readOnly: true
        });

        this.getView().add(view);
    },

    onParametrosFornecedorClick: function (btn, e) {
        const view = Ext.create({
            xtype: 'formpessoasformulafornecedor',
            permissoes: this.getView().getPermissoes()            
        });

        view.getViewModel().set({
            pessoa: this.getRecord(),
            readOnly: true
        });

        this.getView().add(view);
    },
    
    onPrecosClick: function (btn, e) {
        const view = Ext.create({
            xtype: 'formpessoasprecos'
        });

        view.getViewModel().set({
            pessoa: this.getRecord(),
            readOnly: true
        });

        this.getView().add(view);
    },

    onPropriedadesClick: function (btn, e) {

        const view = this.getView();
        const record = this.getRecord();

        try {
            view.initGauge();
    
            const janelaPropriedades = Ext.create({
                xtype: 'propriedades',
                title: 'Pessoa:  ' + record.get('PESSOAS_NOME'),
                permissoes: this.getView().getPermissoes()
            });
    
            janelaPropriedades.getViewModel().set({
                model: record
            });
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível carregar as propriedades');
        }
        
        view.stopGauge();

    },

    onAssistenciasClick: function (btn, e) {

        const view = this.getView();
        const record = this.getRecord();

        try {
            view.initGauge();
    
            const janelaAssistencias = Ext.create({
                xtype: 'assistencias',
                title: 'Assistência Técnica para:  ' + record.get('PESSOAS_NOME'),
                permissoes: this.getView().getPermissoes()
            });
    
            janelaAssistencias.getViewModel().set({
                model: record
            });
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível carregar as assistências');
        }
        
        view.stopGauge();

    },

    onSefazClick: async function(btn, evento){
        const view = this.getView(),
              model = this.getRecord(),
              campoCpfCnpj = view.lookupReference('cpf'),
              campoNascimento   = view.lookupReference('nascimento');

        /*SE FOR CPF OU CNPJ, DEFINE O CAMPO CATEGORIA */
        const cpfCnpj        = model.get('PESSOAS_CPFCNPJ');

        if( campoNascimento.getRawValue() == '' && campoCpfCnpj.getRawValue().length == 11 ){
            Ext.Note(
                'warning', 
                `Informe o nascimento!<br><br>
                `, 1000);   
            campoNascimento.focus();
            return;
        }

        //Se for CPF/CNPJ valido
        //Se for um CPF
        if( campoCpfCnpj.getRawValue().length == 11 ){
            if( !SamosUtils.String.isCpf( campoCpfCnpj.getRawValue() ) ){
                campoCpfCnpj.focus();
                return;
            }

        }else{
            if( !SamosUtils.String.isCnpj( campoCpfCnpj.getRawValue() ) ){
                campoCpfCnpj.focus();
                return;
            }
        }
        
        if(await SamosUtils.Msg.confirm('Deseja carregar os dados da SEFAZ ?')){
            try {
                //this.getView().initGauge('Buscando dados...');
                this.onConsultarCpfAPI(btn, evento);
               
            } catch (error) {
                SamosUtils.Msg.alert('CPF/CNPJ não encontrado na Sefaz');
            }
        
        }
    },

    copiarParaCobranca: function(txt) {
        if(!this.getRecord().isNew()) { return; }
        const ref = txt.reference;
        const value = configs.getCase() == 'uppercase' ? txt.getValue().toUpperCase() : txt.getValue();

        if(ref == 'cep') {
            this.lookup('cepcobranca').setValue(value);
            this.lookup('cepcobranca').setSearchedId(value);
        } else if(ref == 'cidade') {
            this.lookup('cidadecobranca').setValue(value);
            this.lookup('cidadecobranca').setSearchedId(value);
        } else if(ref == 'idcidades') {
            this.lookup('idcidadescobranca').setValue(value);
            this.lookup('idcidadescobranca').setSearchedId(value);
        } else if(ref == 'uf') {
            this.lookup('ufcobranca').setValue(value);
        } else if(ref == 'idcidades') {
            this.lookup('idcidadescobranca').setValue(value);
        } else if(ref == 'ibge') {
            this.lookup('ibgecobranca').setValue(value);
        } else if(ref == 'endereco') {
            this.lookup('endereco').setValue(value);
            this.lookup('enderecocobranca').setValue(value);
        } else if(ref == 'numero') {
            this.lookup('numerocobranca').setValue(value);
        } else if(ref == 'bairro') {
            this.lookup('bairro').setValue(value);
            this.lookup('bairrocobranca').setValue(value);
        } else if(ref == 'telefone' && !configs.getPessoas().usarCampoRG) {
//          this.lookup('telefonecobranca').setValue(value);
        } else if(ref == 'celular') {
            this.lookup('celularcobranca').setValue(value);
        }
    },

    copiarParaCobranca_generico: function(btn, e){
        
        const vm = this.getViewModel();

        this.lookup('cepcobranca').setValue( this.lookup('cep').getValue() );
        this.lookup('cidadecobranca').setValue( this.lookup('cidade').getValue() );
        this.lookup('idcidadescobranca').setValue(this.lookup('idcidades').getValue() );
        this.lookup('ufcobranca').setValue(this.lookup('uf').getValue() );
        this.lookup('ibgecobranca').setValue(this.lookup('ibge').getValue() );
        this.lookup('enderecocobranca').setValue(this.lookup('endereco').getValue() );
        this.lookup('numerocobranca').setValue(this.lookup('numero').getValue());
        this.lookup('bairrocobranca').setValue(this.lookup('bairro').getValue() );
//      this.lookup('telefonecobranca').setValue(this.lookup('telefone').getValue() );
        this.lookup('celularcobranca').setValue(this.lookup('celular').getValue() );   
        btn.el.dom.click(); 

        Ext.defer( function(){
            //Isso impede que ele ja abra o form focado nesse campo
            if( vm.get('jaClicouBotaoCopiarPelaPrimeraVez') == true ){
                this.lookup('telefonecobranca').focus();
            }
            vm.set('jaClicouBotaoCopiarPelaPrimeraVez', true);
            
            Ext.defer( function(){
                if( btn.checked ){
                    btn.el.dom.click(); 
                }
            }, 50, this );

        }, 200, this);
    },

    onNaturezaChange: function (combo, nv, ov) {
        var txtCpf = this.getReferences()['cpf'],
            cpfCnpj = this.getViewModel().get('model.PESSOAS_CPFCNPJ'),
            natureza = nv ? nv.toUpperCase() : undefined;

        if (natureza == 'FISICA') {
            txtCpf.setTextMask('___.___.___-__', cpfCnpj);

        } else {
            txtCpf.setTextMask('__.___.___/____-__', cpfCnpj);
        }
    },

    onCategoriaChange: function (combo, nv, ov) {
        let txtCpf = this.getReferences()['cpf']
        let categoria = nv ? nv.toUpperCase() : undefined;

        if (categoria == '3') {
            txtCpf.setValue('99999999000191');
        }
    },

    listenClickImg: function (img) {
        img.el.dom.onclick = event => {
            if(this.getViewModel().get('updating')) {
                const photoView = Ext.create({
                    xtype: 'samoswidgets-photo',
                    field: 'FOTO',
                    model: this.getRecord()
                });

                this.getView().add(photoView);
            }
        };
    },

    onSairCampoCPFCNPJ: async function(txt, event){
        if(txt.getValue().trim() == '9999') {
            txt.setValue('99999999000191');
        }

        if(!this.getView().ultimoCpfConsultado){
            this.getView().ultimoCpfConsultado = 'nenhum';
        }

        if(!this.getRecord().isNew()) { return; }

        if( this.getView().lookupReference('cpf').getValue().trim() != this.getView().ultimoCpfConsultado){
            this.onConsultarCpfAPI();
            this.getView().ultimoCpfConsultado = this.getView().lookupReference('cpf').getValue().trim();
        }
    },

    verificarCPFCNPJExistente: async function (txt, event) {
        if (!SamosUtils.Events.isTab(event) && !SamosUtils.Events.isEnter(event)) {
            return;
        }

        const view = this.getView();

        try {
            const model = this.getRecord();
            const txtCpf = this.lookup('cpf');
            const proximoFoco = this.lookup(txt.proximoFoco);
            const cpfCnpjInformado = SamosUtils.String.onlyNumbers(txtCpf.value);
            const tipoPessoa = this.lookup('tipo_sexo').value;
    
            if (model.getValidation(true).get('PESSOAS_CPFCNPJ') !== true) {
                Ext.defer(txtCpf.focus, 100, txtCpf, [true]);
                throw model.getValidation(true).get('PESSOAS_CPFCNPJ');
            }
            
            if (!model.phantom || this.ignoreDocument(model)) {
                return
            }
            
            view.initGauge('Verificando disponibilidade CPF/CNPJ...');

            const queryCPF = await SamosUtils.Request.nodeApi({
                url: `/consultas/existe`,
                method: 'GET',
                query: {
                    tabela: 'PESSOAS',
                    campo: 'PESSOAS_CPFCNPJ',
                    conteudo: cpfCnpjInformado,
                    tipo: (tipoPessoa || '')
                }
            });

            if (queryCPF.results[0]) {
                const pessoasId = queryCPF.results[0]['PESSOAS_ID'];

                if(configs.getPessoas().impedirCnpjRepetido) {
                    Ext.Msg.alert('Atenção', `CPF/CNPJ já cadastrado: ${pessoasId}`);                    
                    model.set('PESSOAS_CPFCNPJ', '');
                    if(configs.getPessoas().carregarCnpjExistente) {
                        Pessoa.services.Model.carregarCpfExistente(pessoasId);
                        this.getViewModel().set('modelId', pessoasId);
                    }                    
                } else {
                    Pessoa.services.Model.carregarCpfExistente(pessoasId);                    
                }
            } else {
                Ext.defer(proximoFoco.focus, 100, proximoFoco, [true]);

                view.getController().onConsultarCpfAPI();
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao checar CPF/CNPJ');
        }

        view.stopGauge(true);


    },

    ignoreDocument: function (model) {
        const cpfcnpj = model.get('PESSOAS_CPFCNPJ');

        return cpfcnpj == '99999999000191' || this.getViewModel().get('cadastroCpfDuplicadoLiberado');
    },

    onImprimirClick: async function () {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const model = this.getRecord();
                const tipo = configs.getPessoas().tipos.find(list => list[0] == model.get('PESSOAS_TIPO'));

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/fichapessoa`,
                    method: 'GET',
                    query: {
                        conteudo   : model.get('PESSOAS_ID'),
                        empresacnpj: configs.getEmpresa().cnpj,
                        ordem      : 5,
                        nometipo   : tipo ? tipo[1] : '',            
                        status     : 2
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onDocumentosClick: function() {
        const view = Ext.create({
            xtype: 'formpessoasdocumentos'
        });

        view.getViewModel().set({
            'idPessoa' : this.getRecord().get('PESSOAS_ID')
        });
    },

    /**CONSULTA DE CPF/CNPJ */
    onConsultarCpfAPI: async function(btn, evento){
        const view = this.getView(),
              vm = this.getViewModel(),
              model = vm.get('model'),
              campo             = view.lookupReference('cpf');
              campoNascimento   = view.lookupReference('nascimento'),
              campoNome         = view.lookupReference('nome'),
              campoCategoria    = view.lookupReference('categoria');

        if( campo.getValue().trim() == '' ){
            Ext.Note(
                'warning', 
                `CPF não foi informado!<br><br>
                `, 1000);   
            return;
        }

        //Se nao tiver nem o minimo de caracteres de um CPF OU CNPJ, ELE DIZ PRA TERMINAR DE DIGITAR
        if( campo.getValue().trim().length < 11 ){
            Ext.Note(
                'warning', 
                `CPF invalido!<br><br>
                `, 1000);  
            return;
        }
        
        if( campo.getValue().length == 11 || campoCategoria.getValue() == 3){  // CPF ou Exportação
        }else{
            campoNascimento.setFieldLabel( 'Abertura' );
            campoCategoria.setValue('0');

            view.initGauge('Consultando SEFAZ...');

            const url = new URL(`https://api.cnpja.com/office/${ SamosUtils.String.onlyNumbers(campo.getValue().trim()) }?registrations=BR`);
            const consulta = await fetch(url, {
                method: 'GET',
                headers: {
                   'Content-Type': 'application/json',
                   'Authorization': '393ca38d-9a7b-48c1-9cc2-80f85ca7a5c3-7d08b990-6efb-46c7-bf13-597f44a43983'
                }
            });
            const resultadoConsulta = (await consulta.json());

            if(resultadoConsulta['status'])
            {
                if( resultadoConsulta['status']['text'] != 'Ativa'){
                    view.stopGauge();
                    SamosUtils.Msg.alert(`ERRO. Empresa com status SEFAZ: ${ resultadoConsulta['status']['text'] } `);
                    
                    campo.setValue('');
                    Ext.defer( ()=>{
                        campo.focus();
                    }, 100, this );

                    return;
                }
            }

            if( (resultadoConsulta['registrations'] || []).length == 0 ){
                campoCategoria.setValue('1');
            }

            if(resultadoConsulta['registrations'])
            {
                if(resultadoConsulta['registrations'].length > 0){
                    if( resultadoConsulta['registrations'].length == 1  ){
                        model.set({
                            'PESSOAS_INSCRICAO'   : resultadoConsulta['registrations'].length > 0 ? resultadoConsulta['registrations'][0]['number'] : ''
                        })
                    } else {
                        const inscricaoEstado = resultadoConsulta['registrations'].filter( (inscricao)=>{ if(inscricao['state'] == resultadoConsulta['address']['state'] && inscricao['enabled'] == true){ return inscricao } } );
                        const indexUltimo = inscricaoEstado.length-1;
                        model.set({
                            'PESSOAS_INSCRICAO'   : inscricaoEstado[indexUltimo] ? inscricaoEstado[indexUltimo]['number'] : ''
                        })
                    }
                } else {
                    model.set({
                        'PESSOAS_INSCRICAO'   : ''
                    }) 
                }

                function getInscricoesValidaEmMeioInvalidas(inscricoes)
                {
                    let incricoesValidas = [];
                    for( let i = 0 ; i < inscricoes.length ; i++ )
                    {
                        if( inscricoes[i]['enabled'] == true )
                        {
                            incricoesValidas.push( inscricoes[i] );
                        }
                    }
                    return incricoesValidas;
                }

                function getInscricoesEstado(inscricoes, estadoParam)
                {
                    let incricoesEstado = [];
                    for( let i = 0 ; i < inscricoes.length ; i++ )
                    {
                        if( inscricoes[i]['state'] == estadoParam )
                        {
                            incricoesEstado.push( inscricoes[i] );
                        }
                    }
                    return incricoesEstado;
                }

                let todasInscricoesValidas = getInscricoesValidaEmMeioInvalidas( resultadoConsulta['registrations'] );
                let todasInscricoesValidasEstado = getInscricoesEstado( todasInscricoesValidas, resultadoConsulta['address']['state'] );
                let isInscricaoValida = true;

                if( todasInscricoesValidasEstado.length > 0 || 
                    (resultadoConsulta['registrations'] || []).length == 0 || 
                    resultadoConsulta['address']['state'] == 'BA' ||
                    String(resultadoConsulta['company']['name'] || '').match(/ASSOC/)
                    ){
                    //Esta valida
                    isInscricaoValida = true;
                } else {
                    isInscricaoValida = false;
                }

                if( isInscricaoValida == false ){
                    view.stopGauge();

                    if(configs.getPessoas().permiteIEBaixada) {
                        Ext.Msg.confirm('Confirmação', 'Pessoa com IE Baixada/Inválida - continuar', btn => {
                            if (btn == 'yes') {
                                model.set({
                                    'PESSOAS_INSCRICAO'   : ''
                                })         
                            } else {
                                campo.setValue('');
                                Ext.defer( ()=>{
                                    campo.focus();
                                }, 100, this );

                                model.set({
                                    'PESSOAS_INSCRICAO'   : ''
                                })   
                                return;
                            }
                        });
                    } else {
                        SamosUtils.Msg.alert(`ERRO. Empresa com inscrição inválida! `);
                        campo.setValue('');
                        Ext.defer( ()=>{
                            campo.focus();
                        }, 100, this );
    
                        return;    
                    }

                }

                model.set({
                    'PESSOAS_NOME'          : String(resultadoConsulta['company']['name'] || '').slice(0,50),
                    'PESSOAS_NASCIMENTO'    : resultadoConsulta['founded'],
                    'PESSOAS_FANTASIA'      : String(resultadoConsulta['alias'] || '').slice(0,50),
                    'PESSOAS_CEP'           : SamosUtils.String.onlyNumbers( resultadoConsulta['address']['zip'] ),
                    'CIDADES_NOME'          : resultadoConsulta['address']['city'],
                    'CIDADES_NOMECOBRANCA'  : resultadoConsulta['address']['city'],
                    'CIDADES_ESTADO'        : resultadoConsulta['address']['state'],
                    'CIDADES_ESTADOCOBRANCA': resultadoConsulta['address']['state'],
                    'PESSOAS_EMAIL'         : resultadoConsulta['emails'].length > 0 ? resultadoConsulta['emails'][0]['address'] : '',
                    'PESSOAS_ENDERECO'      : String(resultadoConsulta['address']['street'] || '').slice(0,50),
                    'PESSOAS_NUMERO'        : resultadoConsulta['address']['number'],
                    'PESSOAS_BAIRRO'        : String(resultadoConsulta['address']['district'] || '').slice(0,50),
                    'PESSOAS_CELULAR'       : resultadoConsulta['phones'][0] ? resultadoConsulta['phones'][0]['area'] + resultadoConsulta['phones'][0]['number'] : '',
                    'PESSOAS_PAGINA'        : resultadoConsulta['address']['details'] || ''
                }) 

                const consultaIdCidade = (await SamosUtils.Request.nodeApi({
                    url: '/consultas/ceps',
                    method: 'GET',
                    data: {
                        conteudo: model.get('PESSOAS_CEP'),
                        ordem: 0,
                        start: 0,
                        limit: 1
                    }
                })).results;

                if( consultaIdCidade.length > 0 )
                {
                    const idCidade = consultaIdCidade[0]['CEPS_ID'];
                    model.set({
                        'PESSOAS_ID_CIDADES': idCidade,
                        'PESSOAS_ID_CIDADESCOBRANCA': idCidade
                    });

                    view.lookup('cep').setSearchedId( model.get('PESSOAS_CEP') );
                    view.lookup('cepcobranca').setSearchedId( model.get('PESSOAS_CEP') );
                }

                view.lookupReference('cidade')         .setValue( resultadoConsulta['address']['city'] );
                view.lookupReference('uf')             .setValue( resultadoConsulta['address']['state'] );
                view.lookupReference('celularcobranca').setValue( resultadoConsulta['phones'][0] ? resultadoConsulta['phones'][0]['area'] + resultadoConsulta['phones'][0]['number'] : '' );
            }
            
            view.stopGauge();
        }


    }
});
